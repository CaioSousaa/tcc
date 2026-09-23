import type { EntityManager } from "typeorm";
import type { LabelColor, LabelView } from "../domain/labels";

type Queryable = Pick<EntityManager, "query">;

type LabelRow = { id: string; name: string; color: LabelColor; usage: number };

/**
 * Labels of a board in creation order, with usage aggregated in one statement
 * (RF08 F101, N160, D40). Callers must have checked access to the board.
 */
export async function loadLabels(db: Queryable, boardId: string): Promise<LabelView[]> {
  const rows: LabelRow[] = await db.query(
    `SELECT l.id, l.name, l.color, COALESCE(u.usage, 0)::int AS usage
       FROM labels l
       LEFT JOIN (
         SELECT cl.label_id, count(*) AS usage
           FROM card_labels cl
          WHERE cl.board_id = $1
          GROUP BY cl.label_id
       ) u ON u.label_id = l.id
      WHERE l.board_id = $1
      ORDER BY l.created_at, l.id`,
    [boardId],
  );
  return rows.map((row) => ({ id: row.id, name: row.name, color: row.color, usage: Number(row.usage) }));
}

/** Label ids of one card in label order (F101). Callers must have resolved the card. */
export async function loadCardLabelIds(db: Queryable, cardId: string): Promise<string[]> {
  const rows: Array<{ label_id: string }> = await db.query(
    `SELECT cl.label_id
       FROM card_labels cl
       JOIN labels l ON l.id = cl.label_id
      WHERE cl.card_id = $1
      ORDER BY l.created_at, l.id`,
    [cardId],
  );
  return rows.map((row) => String(row.label_id));
}
