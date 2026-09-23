import { randomUUID } from "node:crypto";
import { DEFAULT_LIST_NAMES, type BoardDetail, type BoardSummary } from "../domain/boards";
import { assertCan } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { BoardRepository } from "../repositories/BoardRepository";
import type { CreateBoardInput, UpdateBoardInput } from "../schemas/board.schemas";
import { boardScopeFor } from "./boardAccess";

export class BoardService {
  constructor(private readonly boards: BoardRepository) {}

  /** `today` of the viewer's device for the overdue count (RF10 F139). */
  list(userId: string, today: string | null = null): Promise<BoardSummary[]> {
    return this.boards.listSummaries(boardScopeFor(userId), today);
  }

  async create(userId: string, input: CreateBoardInput): Promise<BoardDetail> {
    const scope = boardScopeFor(userId);
    const id = randomUUID();
    const lists = input.withDefaultLists
      ? DEFAULT_LIST_NAMES.map((name, index) => ({ id: randomUUID(), name, position: index + 1 }))
      : [];

    await this.boards.createWithLists(scope, { id, name: input.name, color: input.color, lists });

    const created = await this.boards.findDetail(scope, id);
    if (!created) throw new Error("Board not found right after creation");
    return created;
  }

  /** Missing boards and boards the account does not participate in are indistinguishable (F11, RF07 RN02). */
  async get(userId: string, boardId: string): Promise<BoardDetail> {
    const board = await this.boards.findDetail(boardScopeFor(userId), boardId);
    if (!board) throw new AppError("BOARD_NOT_FOUND");
    return board;
  }

  /** Under the board lock: participation, then permission, then the write (RF07 C148). */
  async update(userId: string, boardId: string, input: UpdateBoardInput): Promise<BoardSummary> {
    const result = await this.boards.withBoardLock(boardScopeFor(userId), boardId, async (tx, role) => {
      assertCan(role, "board.update");
      await tx.update({ name: input.name, color: input.color, lockListDeletion: input.lockListDeletion });
      const updated = await tx.summary();
      if (!updated) throw new Error("Board missing right after its update");
      return updated;
    });
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
    return result.value;
  }

  /** Only administrators; people, invitations and assignments go by cascade (RF07 RN15). */
  async delete(userId: string, boardId: string): Promise<void> {
    const result = await this.boards.withBoardLock(boardScopeFor(userId), boardId, async (tx, role) => {
      assertCan(role, "board.delete");
      await tx.delete();
    });
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
  }
}
