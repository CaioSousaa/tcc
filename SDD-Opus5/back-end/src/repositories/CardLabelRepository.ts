import type { DataSource, EntityManager } from "typeorm";
import type { LabelView } from "../domain/labels";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInCardLock, type CardLockResult } from "./cardLock";
import type { LabelRecord } from "./LabelRepository";
import { loadCardLabelIds, loadLabels } from "./labels";
import { isForeignKeyViolation } from "./pgErrors";

/** Primitive operations on the labels of one locked card (RF08 plan 2.3). */
export interface CardLabelTransaction {
  /** Label of the card's own board, or `null` (F100, CA36). */
  findLabel(labelId: string): Promise<LabelRecord | null>;
  /**
   * Idempotent (ON CONFLICT DO NOTHING, N170). Returns `false` when the composite
   * foreign key refuses the row: the label was deleted meanwhile (N171).
   */
  apply(labelId: string): Promise<boolean>;
  /** Idempotent: removing a label that is not applied changes nothing (RN07). */
  remove(labelId: string): Promise<void>;
  listCardLabelIds(): Promise<string[]>;
  listLabels(): Promise<LabelView[]>;
}

export interface CardLabelRepository {
  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CardLabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>>;
}

class TypeOrmCardLabelTransaction implements CardLabelTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
    private readonly cardId: string,
  ) {}

  async findLabel(labelId: string): Promise<LabelRecord | null> {
    const rows: LabelRecord[] = await this.manager.query(
      `SELECT id, name, color FROM labels WHERE id = $1 AND board_id = $2`,
      [labelId, this.boardId],
    );
    return rows[0] ?? null;
  }

  async apply(labelId: string): Promise<boolean> {
    try {
      // board_id comes from the locked card itself, never from the client (D38, C189).
      await this.manager.query(
        `INSERT INTO card_labels (card_id, label_id, board_id)
         SELECT c.id, $2, l.board_id
           FROM cards c
           JOIN lists l ON l.id = c.list_id
          WHERE c.id = $1 AND l.board_id = $3
         ON CONFLICT (card_id, label_id) DO NOTHING`,
        [this.cardId, labelId, this.boardId],
      );
      return true;
    } catch (error) {
      if (isForeignKeyViolation(error)) return false;
      throw error;
    }
  }

  async remove(labelId: string): Promise<void> {
    await this.manager.query(`DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2`, [this.cardId, labelId]);
  }

  listCardLabelIds(): Promise<string[]> {
    return loadCardLabelIds(this.manager, this.cardId);
  }

  listLabels(): Promise<LabelView[]> {
    return loadLabels(this.manager, this.boardId);
  }
}

export class TypeOrmCardLabelRepository implements CardLabelRepository {
  constructor(private readonly dataSource: DataSource) {}

  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CardLabelTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    return runInCardLock(this.dataSource, scope, boardId, cardId, (manager, role) =>
      // cardId is non-null whenever work runs.
      work(new TypeOrmCardLabelTransaction(manager, boardId, cardId ?? ""), role),
    );
  }
}
