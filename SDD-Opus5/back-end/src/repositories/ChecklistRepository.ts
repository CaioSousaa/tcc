import type { DataSource, EntityManager } from "typeorm";
import type { ChecklistItem } from "../domain/checklist";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInCardLock, type CardLockResult } from "./cardLock";
import { loadChecklistItems, toChecklistItem } from "./checklistItems";

export type { CardLockResult } from "./cardLock";

export type ChecklistChanges = { text?: string | undefined; done?: boolean | undefined };

/** Primitive operations on the items of one locked card, without business rules (RF06 F65). */
export interface ChecklistTransaction {
  count(): Promise<number>;
  nextPosition(): Promise<number>;
  insert(item: ChecklistItem): Promise<void>;
  /** `null` when the item does not belong to this card (N117). */
  findItem(itemId: string): Promise<ChecklistItem | null>;
  /** Writes only the fields present in `changes` (CB15, N125). */
  update(itemId: string, changes: ChecklistChanges): Promise<void>;
  remove(itemId: string): Promise<void>;
  listItems(): Promise<ChecklistItem[]>;
}

export interface ChecklistRepository {
  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: ChecklistTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>>;
}

class TypeOrmChecklistTransaction implements ChecklistTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly cardId: string,
  ) {}

  async count(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total FROM checklist_items WHERE card_id = $1`,
      [this.cardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async nextPosition(): Promise<number> {
    const rows: Array<{ next: number }> = await this.manager.query(
      `SELECT COALESCE(MAX(position), 0)::int + 1 AS next FROM checklist_items WHERE card_id = $1`,
      [this.cardId],
    );
    return Number(rows[0]?.next ?? 1);
  }

  async insert(item: ChecklistItem): Promise<void> {
    await this.manager.query(
      `INSERT INTO checklist_items (id, card_id, text, done, position) VALUES ($1, $2, $3, $4, $5)`,
      [item.id, this.cardId, item.text, item.done, item.position],
    );
  }

  async findItem(itemId: string): Promise<ChecklistItem | null> {
    const rows: Array<{ id: string; text: string; done: boolean; position: number }> = await this.manager.query(
      `SELECT id, text, done, position FROM checklist_items WHERE id = $1 AND card_id = $2`,
      [itemId, this.cardId],
    );
    const row = rows[0];
    return row ? toChecklistItem(row) : null;
  }

  async update(itemId: string, changes: ChecklistChanges): Promise<void> {
    // COALESCE keeps a column untouched when its parameter is NULL (field absent).
    await this.manager.query(
      `UPDATE checklist_items
          SET text = COALESCE($3, text),
              done = COALESCE($4, done),
              updated_at = now()
        WHERE id = $1 AND card_id = $2`,
      [itemId, this.cardId, changes.text ?? null, changes.done ?? null],
    );
  }

  async remove(itemId: string): Promise<void> {
    await this.manager.query(`DELETE FROM checklist_items WHERE id = $1 AND card_id = $2`, [itemId, this.cardId]);
  }

  listItems(): Promise<ChecklistItem[]> {
    return loadChecklistItems(this.manager, this.cardId);
  }
}

export class TypeOrmChecklistRepository implements ChecklistRepository {
  constructor(private readonly dataSource: DataSource) {}

  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: ChecklistTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    return runInCardLock(this.dataSource, scope, boardId, cardId, (manager, role) =>
      // cardId is non-null whenever work runs.
      work(new TypeOrmChecklistTransaction(manager, cardId ?? ""), role),
    );
  }
}
