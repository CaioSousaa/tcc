import type { DataSource, EntityManager } from "typeorm";
import type { LabelColor, LabelView } from "../domain/labels";
import type { BoardRole } from "../domain/permissions";
import { UniqueConstraintError } from "../errors/AppError";
import type { BoardScope } from "./BoardRepository";
import { runInBoardLock, type LockResult } from "./boardLock";
import { loadLabels } from "./labels";
import { uniqueViolation } from "./pgErrors";

export type LabelRecord = { id: string; name: string; color: LabelColor };
export type LabelChanges = { name: string; color: LabelColor };

/** Primitive operations on the labels of one locked board, without rules (RF08 plan 2.3, F103). */
export interface LabelTransaction {
  count(): Promise<number>;
  /** `null` when the label does not belong to this board (N165). */
  findLabel(labelId: string): Promise<LabelRecord | null>;
  /** Another label of this board has the same case-insensitive name (RN04). */
  isNameTaken(name: string, exceptLabelId?: string): Promise<boolean>;
  /** Throws `UniqueConstraintError` when the unique name index refuses the row (F104). */
  insert(label: LabelRecord): Promise<void>;
  /** Same as insert. `created_at` never changes, so the order is kept (RN11). */
  update(labelId: string, changes: LabelChanges): Promise<void>;
  /** Applications go by ON DELETE CASCADE in the same statement (F99, N172). */
  delete(labelId: string): Promise<void>;
  listLabels(): Promise<LabelView[]>;
}

export interface LabelRepository {
  /** Every label write runs under the board lock with the role read there (F96, C182). */
  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: LabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>>;
  /** Read without lock, scoped by participation; `null` when the account does not participate. */
  findLabels(scope: BoardScope, boardId: string): Promise<LabelView[] | null>;
}

function translateUnique(error: unknown): never {
  const constraint = uniqueViolation(error);
  if (constraint !== undefined) throw new UniqueConstraintError(constraint);
  throw error;
}

class TypeOrmLabelTransaction implements LabelTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
  ) {}

  async count(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total FROM labels WHERE board_id = $1`,
      [this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findLabel(labelId: string): Promise<LabelRecord | null> {
    const rows: LabelRecord[] = await this.manager.query(
      `SELECT id, name, color FROM labels WHERE id = $1 AND board_id = $2`,
      [labelId, this.boardId],
    );
    return rows[0] ?? null;
  }

  async isNameTaken(name: string, exceptLabelId?: string): Promise<boolean> {
    const rows: Array<{ id: string }> = await this.manager.query(
      `SELECT id FROM labels
        WHERE board_id = $1 AND lower(name) = lower($2) AND ($3::uuid IS NULL OR id <> $3::uuid)
        LIMIT 1`,
      [this.boardId, name, exceptLabelId ?? null],
    );
    return rows.length > 0;
  }

  async insert(label: LabelRecord): Promise<void> {
    try {
      await this.manager.query(`INSERT INTO labels (id, board_id, name, color) VALUES ($1, $2, $3, $4)`, [
        label.id,
        this.boardId,
        label.name,
        label.color,
      ]);
    } catch (error) {
      translateUnique(error);
    }
  }

  async update(labelId: string, changes: LabelChanges): Promise<void> {
    try {
      await this.manager.query(
        `UPDATE labels SET name = $3, color = $4, updated_at = now() WHERE id = $1 AND board_id = $2`,
        [labelId, this.boardId, changes.name, changes.color],
      );
    } catch (error) {
      translateUnique(error);
    }
  }

  async delete(labelId: string): Promise<void> {
    await this.manager.query(`DELETE FROM labels WHERE id = $1 AND board_id = $2`, [labelId, this.boardId]);
  }

  listLabels(): Promise<LabelView[]> {
    return loadLabels(this.manager, this.boardId);
  }
}

export class TypeOrmLabelRepository implements LabelRepository {
  constructor(private readonly dataSource: DataSource) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: LabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return runInBoardLock(this.dataSource, scope, boardId, (manager, role) =>
      work(new TypeOrmLabelTransaction(manager, boardId), role),
    );
  }

  async findLabels(scope: BoardScope, boardId: string): Promise<LabelView[] | null> {
    const members: Array<{ board_id: string }> = await this.dataSource.query(
      `SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, scope.userId],
    );
    if (members.length === 0) return null;
    return loadLabels(this.dataSource, boardId);
  }
}
