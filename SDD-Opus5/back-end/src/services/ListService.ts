import { randomUUID } from "node:crypto";
import type { ListWithCards } from "../domain/cards";
import { NO_DELETION_RULE, type ListDeletionRequest } from "../domain/listDeletion";
import { clampPosition } from "../domain/lists";
import { assertCan } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { BoardListRepository, ListRecord, ListTransaction } from "../repositories/BoardListRepository";
import { isUuid } from "../schemas/board.schemas";
import type { CreateListInput, UpdateListInput } from "../schemas/list.schemas";
import { boardScopeFor } from "./boardAccess";

export type ListsResult = { lists: ListWithCards[] };
export type ListMutationResult = { list: ListWithCards; lists: ListWithCards[] };

function pick(lists: ListWithCards[], listId: string): ListWithCards {
  const list = lists.find((item) => item.id === listId);
  if (!list) throw new Error("List missing from its own board after a write");
  return list;
}

export class ListService {
  constructor(private readonly repository: BoardListRepository) {}

  /**
   * Board access is always resolved first, so a foreign board never reveals its lists (C55);
   * then the role, before any list is read (RF07 C148). Every list write is "list.manage".
   */
  private async inBoard<T>(userId: string, boardId: string, work: (tx: ListTransaction) => Promise<T>): Promise<T> {
    const result = await this.repository.withBoardLock(boardScopeFor(userId), boardId, (tx, role) => {
      assertCan(role, "list.manage");
      return work(tx);
    });
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
    return result.value;
  }

  /** A malformed id, a missing list and a list of another board are all "not found" (F24, CA36). */
  private async requireList(tx: ListTransaction, listId: string): Promise<ListRecord> {
    if (!isUuid(listId)) throw new AppError("LIST_NOT_FOUND");
    const list = await tx.findList(listId);
    if (!list) throw new AppError("LIST_NOT_FOUND");
    return list;
  }

  /** Insert at P and push P..N one position right (RN06, RN09, CB07). */
  create(userId: string, boardId: string, input: CreateListInput): Promise<ListMutationResult> {
    return this.inBoard(userId, boardId, async (tx) => {
      const count = await tx.count();
      const position = clampPosition(input.position ?? count + 1, count + 1);
      const id = randomUUID();

      await tx.shiftRight(position);
      await tx.insert({ id, name: input.name, position });

      const lists = await tx.listAll();
      return { list: pick(lists, id), lists };
    });
  }

  /** Rename and, when a position is given, move within 1..N (RN07, RN09, CB08, CB16). */
  update(userId: string, boardId: string, listId: string, input: UpdateListInput): Promise<ListMutationResult> {
    return this.inBoard(userId, boardId, async (tx) => {
      const list = await this.requireList(tx, listId);
      await tx.rename(list.id, input.name);

      if (input.position !== undefined) {
        const target = clampPosition(input.position, await tx.count());
        if (target !== list.position) await tx.move(list.id, list.position, target);
      }

      const lists = await tx.listAll();
      return { list: pick(lists, list.id), lists };
    });
  }

  /**
   * Deletes a list (RF03) and, when it holds cards, applies the confirmed rule (RF05).
   * The order of checks is mandatory and runs under the board lock (plan 2.3, C95, C96).
   */
  delete(
    userId: string,
    boardId: string,
    listId: string,
    request: ListDeletionRequest = NO_DELETION_RULE,
  ): Promise<ListsResult> {
    return this.inBoard(userId, boardId, async (tx) => {
      const list = await this.requireList(tx, listId);
      const cardCount = await tx.countCards(list.id);

      // An empty list is deleted whatever rule was sent, even with the lock on (RN02, CA06, CA24).
      if (cardCount > 0) {
        if (await tx.isListDeletionLocked()) throw new AppError("LIST_DELETION_LOCKED");
        if (request.strategy === undefined || request.expectedCardCount === undefined) {
          throw new AppError("LIST_DELETION_STRATEGY_REQUIRED");
        }
        if (request.expectedCardCount !== cardCount) throw new AppError("LIST_CARD_COUNT_CHANGED");

        if (request.strategy === "move") {
          const targetListId = request.targetListId;
          if (targetListId === undefined || targetListId === list.id) {
            throw new AppError("VALIDATION_ERROR", { targetListId: MESSAGES.targetListInvalid });
          }
          if (!isUuid(targetListId) || !(await tx.findList(targetListId))) {
            throw new AppError("TARGET_LIST_NOT_FOUND");
          }
          await tx.appendCards(list.id, targetListId, await tx.countCards(targetListId));
        }
        // "cascade": cards go with the list through ON DELETE CASCADE (F54).
      }

      await tx.remove(list.id);
      await tx.shiftLeft(list.position);

      return { lists: await tx.listAll() };
    });
  }
}
