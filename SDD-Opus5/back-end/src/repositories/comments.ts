import type { EntityManager } from "typeorm";
import type { CommentView } from "../domain/comments";

type Queryable = Pick<EntityManager, "query">;

type CommentRow = {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: Date;
  edited_at: Date | null;
};

/**
 * History of one card in publication order, with author names, in one statement
 * (RF09 D43, N184). Callers must have resolved the card inside an accessible board.
 */
export async function loadComments(db: Queryable, cardId: string): Promise<CommentView[]> {
  const rows: CommentRow[] = await db.query(
    `SELECT cm.id, cm.author_id, u.name AS author_name, cm.body, cm.created_at, cm.edited_at
       FROM card_comments cm
       JOIN users u ON u.id = cm.author_id
      WHERE cm.card_id = $1
      ORDER BY cm.created_at, cm.id`,
    [cardId],
  );
  return rows.map((row) => ({
    id: row.id,
    author: { userId: row.author_id, name: row.author_name },
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    edited: row.edited_at !== null,
  }));
}
