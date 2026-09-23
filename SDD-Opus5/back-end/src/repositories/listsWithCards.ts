import type { EntityManager } from "typeorm";
import type { ListWithCards } from "../domain/cards";

type Queryable = Pick<EntityManager, "query">;

type ListRow = { id: string; name: string; position: number };
type CardRow = {
  id: string;
  list_id: string;
  title: string;
  position: number;
  checklist_total: number;
  checklist_done: number;
  assignee_ids: string[] | null;
  label_ids: string[] | null;
  comment_count: number;
  due_date: string | null;
};

/**
 * Lists of a board with their cards, in two statements whatever the number of
 * lists and cards (RF04 N67, N68). `listIds` restricts the result to some lists.
 * Card counts are derived from the cards returned, so they always match (RN17).
 */
export async function loadListsWithCards(
  db: Queryable,
  boardId: string,
  listIds?: readonly string[],
): Promise<ListWithCards[]> {
  const restrict = listIds !== undefined;
  if (restrict && listIds.length === 0) return [];

  const lists: ListRow[] = await db.query(
    restrict
      ? `SELECT id, name, position FROM lists WHERE board_id = $1 AND id = ANY($2::uuid[]) ORDER BY position`
      : `SELECT id, name, position FROM lists WHERE board_id = $1 ORDER BY position`,
    restrict ? [boardId, listIds] : [boardId],
  );
  if (lists.length === 0) return [];

  const cards: CardRow[] = await db.query(
    // Checklist counts are aggregated in this same statement: no query per card (RF06 N112).
    // due_date as text: the driver would turn a date into a local Date (RF10 D49).
    `SELECT c.id, c.list_id, c.title, c.position, c.due_date::text AS due_date,
            COALESCE(ci.total, 0)::int AS checklist_total,
            COALESCE(ci.done, 0)::int AS checklist_done,
            -- Assignees in order of assignment, in this same statement (RF07 N136).
            (SELECT COALESCE(array_agg(a.user_id::text ORDER BY a.assigned_at, a.user_id), '{}'::text[])
               FROM card_assignees a
              WHERE a.card_id = c.id) AS assignee_ids,
            -- Labels in label order, in this same statement (RF08 N161).
            (SELECT COALESCE(array_agg(cl.label_id::text ORDER BY lb.created_at, lb.id), '{}'::text[])
               FROM card_labels cl
               JOIN labels lb ON lb.id = cl.label_id
              WHERE cl.card_id = c.id) AS label_ids,
            -- Comments counted in this same statement (RF09 N185).
            (SELECT count(*)::int FROM card_comments cm WHERE cm.card_id = c.id) AS comment_count
       FROM cards c
       JOIN lists l ON l.id = c.list_id
       LEFT JOIN (
         SELECT i.card_id, count(*) AS total, count(*) FILTER (WHERE i.done) AS done
           FROM checklist_items i
           JOIN cards ic ON ic.id = i.card_id
           JOIN lists il ON il.id = ic.list_id
          WHERE il.board_id = $1 AND ic.list_id = ANY($2::uuid[])
          GROUP BY i.card_id
       ) ci ON ci.card_id = c.id
      WHERE l.board_id = $1 AND c.list_id = ANY($2::uuid[])
      ORDER BY c.list_id, c.position`,
    [boardId, lists.map((list) => list.id)],
  );

  const byList = new Map<string, ListWithCards["cards"]>();
  for (const card of cards) {
    const bucket = byList.get(card.list_id) ?? [];
    bucket.push({
      id: card.id,
      title: card.title,
      position: Number(card.position),
      checklistTotal: Number(card.checklist_total),
      checklistDone: Number(card.checklist_done),
      assigneeIds: (card.assignee_ids ?? []).map(String),
      labelIds: (card.label_ids ?? []).map(String),
      commentCount: Number(card.comment_count ?? 0),
      dueDate: card.due_date ?? null,
    });
    byList.set(card.list_id, bucket);
  }

  return lists.map((list) => {
    const listCards = byList.get(list.id) ?? [];
    return { id: list.id, name: list.name, position: Number(list.position), cardCount: listCards.length, cards: listCards };
  });
}
