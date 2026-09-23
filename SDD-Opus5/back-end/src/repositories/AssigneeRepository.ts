import type { DataSource, EntityManager } from "typeorm";
import type { AssigneeRef } from "../domain/members";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInCardLock, type CardLockResult } from "./cardLock";
import { loadAssignees } from "./members";
import { isForeignKeyViolation } from "./pgErrors";

/** Primitive operations on the assignees of one locked card (RF07 plan 2.3). */
export interface AssigneeTransaction {
  isMember(userId: string): Promise<boolean>;
  /**
   * Idempotent (ON CONFLICT DO NOTHING, N150). Returns `false` when the database
   * refuses the person as a participant (composite foreign key, D32).
   */
  assign(userId: string): Promise<boolean>;
  /** Idempotent: removing someone who is not an assignee changes nothing (RN11). */
  unassign(userId: string): Promise<void>;
  listAssignees(): Promise<AssigneeRef[]>;
}

export interface AssigneeRepository {
  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: AssigneeTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>>;
}

class TypeOrmAssigneeTransaction implements AssigneeTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
    private readonly cardId: string,
  ) {}

  async isMember(userId: string): Promise<boolean> {
    const rows: Array<{ user_id: string }> = await this.manager.query(
      `SELECT user_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [this.boardId, userId],
    );
    return rows.length > 0;
  }

  async assign(userId: string): Promise<boolean> {
    try {
      // board_id comes from the card itself, never from the client (C159).
      await this.manager.query(
        `INSERT INTO card_assignees (card_id, board_id, user_id)
         SELECT c.id, l.board_id, $2
           FROM cards c
           JOIN lists l ON l.id = c.list_id
          WHERE c.id = $1 AND l.board_id = $3
         ON CONFLICT (card_id, user_id) DO NOTHING`,
        [this.cardId, userId, this.boardId],
      );
      return true;
    } catch (error) {
      if (isForeignKeyViolation(error)) return false;
      throw error;
    }
  }

  async unassign(userId: string): Promise<void> {
    await this.manager.query(`DELETE FROM card_assignees WHERE card_id = $1 AND user_id = $2`, [this.cardId, userId]);
  }

  listAssignees(): Promise<AssigneeRef[]> {
    return loadAssignees(this.manager, this.cardId);
  }
}

export class TypeOrmAssigneeRepository implements AssigneeRepository {
  constructor(private readonly dataSource: DataSource) {}

  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: AssigneeTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    return runInCardLock(this.dataSource, scope, boardId, cardId, (manager, role) =>
      // cardId is non-null whenever work runs.
      work(new TypeOrmAssigneeTransaction(manager, boardId, cardId ?? ""), role),
    );
  }
}
