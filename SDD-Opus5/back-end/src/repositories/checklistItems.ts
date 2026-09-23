import type { EntityManager } from "typeorm";
import type { ChecklistItem } from "../domain/checklist";

type Queryable = Pick<EntityManager, "query">;

type ItemRow = { id: string; text: string; done: boolean; position: number };

export function toChecklistItem(row: ItemRow): ChecklistItem {
  return { id: row.id, text: row.text, done: row.done === true, position: Number(row.position) };
}

/**
 * Items of one card in order (RF06 N113). Callers must have resolved the card
 * inside an accessible board first; this function does not check access.
 */
export async function loadChecklistItems(db: Queryable, cardId: string): Promise<ChecklistItem[]> {
  const rows: ItemRow[] = await db.query(
    `SELECT id, text, done, position FROM checklist_items WHERE card_id = $1 ORDER BY position`,
    [cardId],
  );
  return rows.map(toChecklistItem);
}
