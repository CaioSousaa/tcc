import { randomUUID } from "node:crypto";
import type { CardDetail, CardSummary, ListWithCards } from "../domain/cards";
import { clampPosition } from "../domain/lists";
import { assertCan, type BoardRole } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { BoardCardRepository, CardLocation, CardTransaction } from "../repositories/BoardCardRepository";
import { isUuid } from "../schemas/board.schemas";
import type { CreateCardInput, UpdateCardInput } from "../schemas/card.schemas";
import { boardScopeFor } from "./boardAccess";

export type CreateCardResult = { card: CardSummary; lists: ListWithCards[] };
export type UpdateCardResult = { card: CardDetail; lists: ListWithCards[] };
export type DeleteCardResult = { lists: ListWithCards[] };

function findSummary(lists: ListWithCards[], cardId: string): CardSummary {
  for (const list of lists) {
    const card = list.cards.find((item) => item.id === cardId);
    if (card) return card;
  }
  throw new Error("Card missing from its own list after a write");
}

export class CardService {
  constructor(private readonly repository: BoardCardRepository) {}

  /** Board access first, so another account's board never reveals cards or lists (C71, N73); then the role (RF07 C148). */
  private async inBoard<T>(
    userId: string,
    boardId: string,
    work: (tx: CardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<T> {
    const result = await this.repository.withBoardLock(boardScopeFor(userId), boardId, (tx, role) => {
      assertCan(role, "card.write");
      return work(tx, role);
    });
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
    return result.value;
  }

  private async requireCard(tx: CardTransaction, cardId: string): Promise<CardLocation> {
    if (!isUuid(cardId)) throw new AppError("CARD_NOT_FOUND");
    const card = await tx.findCard(cardId);
    if (!card) throw new AppError("CARD_NOT_FOUND");
    return card;
  }

  private async requireList(tx: CardTransaction, listId: string): Promise<void> {
    if (!isUuid(listId) || !(await tx.findList(listId))) throw new AppError("LIST_NOT_FOUND");
  }

  /** Always at N+1; no other card moves (RN07, CB10). */
  create(userId: string, boardId: string, listId: string, input: CreateCardInput): Promise<CreateCardResult> {
    return this.inBoard(userId, boardId, async (tx) => {
      await this.requireList(tx, listId);

      const id = randomUUID();
      const position = (await tx.countInList(listId)) + 1;
      await tx.insert({ id, listId, title: input.title, description: null, position });

      const lists = await tx.listsWithCards([listId]);
      return { card: findSummary(lists, id), lists };
    });
  }

  async get(userId: string, boardId: string, cardId: string): Promise<CardDetail> {
    // A malformed id never reaches the card query, but the board is still checked first (C71).
    const { boardFound, card } = await this.repository.findCard(
      boardScopeFor(userId),
      boardId,
      isUuid(cardId) ? cardId : null,
    );
    if (!boardFound) throw new AppError("BOARD_NOT_FOUND");
    if (!card) throw new AppError("CARD_NOT_FOUND");
    return card;
  }

  /** Content, due date, list and position in one transaction (RN08–RN10, RN12, CB12, CB18). */
  update(userId: string, boardId: string, cardId: string, input: UpdateCardInput): Promise<UpdateCardResult> {
    return this.inBoard(userId, boardId, async (tx, role) => {
      const card = await this.requireCard(tx, cardId);
      const targetListId = input.listId ?? card.listId;
      const sameList = targetListId === card.listId;
      if (!sameList) await this.requireList(tx, targetListId);
      // The matrix declares a separate action for due dates (RF10 F137).
      if (input.dueDate !== card.dueDate) assertCan(role, "dueDate.write");

      // Due date saved with title and description, all or nothing (RF10 F135, RN04).
      await tx.updateContent(card.id, input.title, input.description, input.dueDate);

      if (sameList) {
        const target = clampPosition(input.position ?? card.position, await tx.countInList(card.listId));
        if (target !== card.position) await tx.moveWithinList(card.id, card.listId, card.position, target);
      } else {
        const count = await tx.countInList(targetListId);
        const target = clampPosition(input.position ?? count + 1, count + 1);
        // Order matters: no statement may leave two cards on the same position (F40, C74).
        await tx.openGap(targetListId, target);
        await tx.relocate(card.id, targetListId, target);
        await tx.closeGap(card.listId, card.position);
      }

      const lists = await tx.listsWithCards(sameList ? [card.listId] : [card.listId, targetListId]);
      const detail = await tx.readCard(card.id);
      if (!detail) throw new Error("Card missing after update");
      return { card: detail, lists };
    });
  }

  /** Remove and close the gap (RN11). */
  delete(userId: string, boardId: string, cardId: string): Promise<DeleteCardResult> {
    return this.inBoard(userId, boardId, async (tx) => {
      const card = await this.requireCard(tx, cardId);
      await tx.remove(card.id);
      await tx.closeGap(card.listId, card.position);
      return { lists: await tx.listsWithCards([card.listId]) };
    });
  }
}
