import type { DataSource, EntityManager } from "typeorm";
import type { ListWithCards } from "../domain/cards";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInBoardLock, type LockResult } from "./boardLock";
import { loadListsWithCards } from "./listsWithCards";

export type { LockResult } from "./boardLock";

export type ListRecord = { id: string; name: string; position: number };

/**
 * Primitive list operations restricted to one locked board (F22). They hold no
 * business rule: the service decides positions and whether a list may go.
 */
export interface ListTransaction {
  count(): Promise<number>;
  /** `null` when the list does not exist in this board (N49). */
  findList(listId: string): Promise<ListRecord | null>;
  /** Number of cards in a list of this board. */
  countCards(listId: string): Promise<number>;
  /** `boards.lock_list_deletion` of the locked board (RF05 RN03). */
  isListDeletionLocked(): Promise<boolean>;
  /** Moves every card of `fromListId` to `toListId` in one statement, adding `offset` to positions (RF05 F52, C98). */
  appendCards(fromListId: string, toListId: string, offset: number): Promise<void>;
  /** position = position + 1 for every list at `fromPosition` or after. */
  shiftRight(fromPosition: number): Promise<void>;
  insert(list: ListRecord): Promise<void>;
  rename(listId: string, name: string): Promise<void>;
  /** Moves `listId` from `from` to `to`, shifting the lists in between in one statement (F26). */
  move(listId: string, from: number, to: number): Promise<void>;
  remove(listId: string): Promise<void>;
  /** position = position - 1 for every list after `afterPosition`. */
  shiftLeft(afterPosition: number): Promise<void>;
  /** All lists of the board ordered by position, with their cards (RF04: list responses keep cards). */
  listAll(): Promise<ListWithCards[]>;
}

export interface BoardListRepository {
  /**
   * Runs `work` in a transaction holding a row lock on the board, which must be
   * accessible to `scope` (F21, C46). `work` receives the role read under the lock
   * (RF07 F79). Any error rolls everything back. When the board is not accessible,
   * `work` is not called.
   */
  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: ListTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>>;
}

class TypeOrmListTransaction implements ListTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
  ) {}

  async count(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total FROM lists WHERE board_id = $1`,
      [this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findList(listId: string): Promise<ListRecord | null> {
    const rows: ListRecord[] = await this.manager.query(
      `SELECT id, name, position FROM lists WHERE id = $1 AND board_id = $2`,
      [listId, this.boardId],
    );
    const row = rows[0];
    return row ? { id: row.id, name: row.name, position: Number(row.position) } : null;
  }

  async countCards(listId: string): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total
         FROM cards c
         JOIN lists l ON l.id = c.list_id
        WHERE c.list_id = $1 AND l.board_id = $2`,
      [listId, this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async isListDeletionLocked(): Promise<boolean> {
    const rows: Array<{ locked: boolean }> = await this.manager.query(
      `SELECT lock_list_deletion AS locked FROM boards WHERE id = $1`,
      [this.boardId],
    );
    return rows[0]?.locked === true;
  }

  async appendCards(fromListId: string, toListId: string, offset: number): Promise<void> {
    // Positions 1..K become offset+1..offset+K: no collision with 1..offset (RF05 F57).
    await this.manager.query(
      `UPDATE cards c
          SET list_id = target.id, position = c.position + $3, updated_at = now()
         FROM lists source, lists target
        WHERE c.list_id = source.id
          AND source.id = $1 AND source.board_id = $4
          AND target.id = $2 AND target.board_id = $4`,
      [fromListId, toListId, offset, this.boardId],
    );
  }

  async shiftRight(fromPosition: number): Promise<void> {
    await this.manager.query(
      `UPDATE lists SET position = position + 1, updated_at = now() WHERE board_id = $1 AND position >= $2`,
      [this.boardId, fromPosition],
    );
  }

  async insert(list: ListRecord): Promise<void> {
    await this.manager.query(`INSERT INTO lists (id, board_id, name, position) VALUES ($1, $2, $3, $4)`, [
      list.id,
      this.boardId,
      list.name,
      list.position,
    ]);
  }

  async rename(listId: string, name: string): Promise<void> {
    await this.manager.query(`UPDATE lists SET name = $1, updated_at = now() WHERE id = $2 AND board_id = $3`, [
      name,
      listId,
      this.boardId,
    ]);
  }

  async move(listId: string, from: number, to: number): Promise<void> {
    // Single statement: the deferrable unique constraint is checked at its end (D19).
    await this.manager.query(
      `UPDATE lists
          SET position = CASE
                WHEN id = $1 THEN $3::int
                WHEN $3::int > $2::int THEN position - 1
                ELSE position + 1
              END,
              updated_at = now()
        WHERE board_id = $4
          AND position BETWEEN LEAST($2::int, $3::int) AND GREATEST($2::int, $3::int)`,
      [listId, from, to, this.boardId],
    );
  }

  async remove(listId: string): Promise<void> {
    await this.manager.query(`DELETE FROM lists WHERE id = $1 AND board_id = $2`, [listId, this.boardId]);
  }

  async shiftLeft(afterPosition: number): Promise<void> {
    await this.manager.query(
      `UPDATE lists SET position = position - 1, updated_at = now() WHERE board_id = $1 AND position > $2`,
      [this.boardId, afterPosition],
    );
  }

  listAll(): Promise<ListWithCards[]> {
    return loadListsWithCards(this.manager, this.boardId);
  }
}

export class TypeOrmBoardListRepository implements BoardListRepository {
  constructor(private readonly dataSource: DataSource) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: ListTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return runInBoardLock(this.dataSource, scope, boardId, (manager, role) =>
      work(new TypeOrmListTransaction(manager, boardId), role),
    );
  }
}
