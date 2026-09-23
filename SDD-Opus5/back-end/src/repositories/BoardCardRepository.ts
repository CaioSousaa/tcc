import type { DataSource, EntityManager } from "typeorm";
import type { CardDetail, ListWithCards } from "../domain/cards";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInBoardLock, type LockResult } from "./boardLock";
import { loadChecklistItems } from "./checklistItems";
import { loadComments } from "./comments";
import { loadCardLabelIds } from "./labels";
import { loadListsWithCards } from "./listsWithCards";
import { loadAssignees } from "./members";

export type CardLocation = { id: string; listId: string; position: number; dueDate: string | null };
export type NewCard = { id: string; listId: string; title: string; description: string | null; position: number };

/**
 * Primitive card operations restricted to one locked board (F35). A card or list
 * of another board is never returned nor touched (F37, N72).
 */
export interface CardTransaction {
  findCard(cardId: string): Promise<CardLocation | null>;
  findList(listId: string): Promise<{ id: string } | null>;
  countInList(listId: string): Promise<number>;
  insert(card: NewCard): Promise<void>;
  /** Title, description and due date in one statement (RF10 F135). */
  updateContent(cardId: string, title: string, description: string | null, dueDate: string | null): Promise<void>;
  /** Single statement, like moving lists (F26, F40). */
  moveWithinList(cardId: string, listId: string, from: number, to: number): Promise<void>;
  /** position + 1 for cards at `fromPosition` or after. */
  openGap(listId: string, fromPosition: number): Promise<void>;
  relocate(cardId: string, toListId: string, toPosition: number): Promise<void>;
  /** position - 1 for cards after `afterPosition`. */
  closeGap(listId: string, afterPosition: number): Promise<void>;
  remove(cardId: string): Promise<void>;
  listsWithCards(listIds: readonly string[]): Promise<ListWithCards[]>;
  /** Full card as saved, for the response of a save (A: `CardDetail`). */
  readCard(cardId: string): Promise<CardDetail | null>;
}

export interface BoardCardRepository {
  /** Same board lock as lists (C67, C69). */
  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: CardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>>;
  /**
   * Read without lock, still scoped by participation and board (F38, RF07 F79). `boardFound` distinguishes the two 404s.
   * `cardId` is `null` when it is not a valid id: only the board is checked.
   */
  findCard(scope: BoardScope, boardId: string, cardId: string | null): Promise<{ boardFound: boolean; card: CardDetail | null }>;
}

type CardDetailRow = {
  id: string;
  title: string;
  description: string | null;
  list_id: string;
  position: number;
  created_at: Date;
  updated_at: Date;
  due_date: string | null;
};

const CARD_DETAIL_SELECT = `
  SELECT c.id, c.title, c.description, c.list_id, c.position, c.created_at, c.updated_at, c.due_date::text AS due_date
    FROM cards c
    JOIN lists l ON l.id = c.list_id
`;

function toCardDetail(
  row: CardDetailRow,
  checklist: CardDetail["checklist"],
  assignees: CardDetail["assignees"],
  labelIds: CardDetail["labelIds"],
  comments: CardDetail["comments"],
): CardDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    listId: row.list_id,
    position: Number(row.position),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    checklist,
    assignees,
    labelIds,
    comments,
    dueDate: row.due_date ?? null,
  };
}

class TypeOrmCardTransaction implements CardTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly boardId: string,
  ) {}

  async findCard(cardId: string): Promise<CardLocation | null> {
    const rows: Array<{ id: string; list_id: string; position: number; due_date: string | null }> = await this.manager.query(
      `SELECT c.id, c.list_id, c.position, c.due_date::text AS due_date
         FROM cards c
         JOIN lists l ON l.id = c.list_id
        WHERE c.id = $1 AND l.board_id = $2`,
      [cardId, this.boardId],
    );
    const row = rows[0];
    return row ? { id: row.id, listId: row.list_id, position: Number(row.position), dueDate: row.due_date ?? null } : null;
  }

  async findList(listId: string): Promise<{ id: string } | null> {
    const rows: Array<{ id: string }> = await this.manager.query(
      `SELECT id FROM lists WHERE id = $1 AND board_id = $2`,
      [listId, this.boardId],
    );
    return rows[0] ?? null;
  }

  async countInList(listId: string): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total
         FROM cards c
         JOIN lists l ON l.id = c.list_id
        WHERE c.list_id = $1 AND l.board_id = $2`,
      [listId, this.boardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async insert(card: NewCard): Promise<void> {
    await this.manager.query(
      `INSERT INTO cards (id, list_id, title, description, position)
       SELECT $1, l.id, $3, $4, $5 FROM lists l WHERE l.id = $2 AND l.board_id = $6`,
      [card.id, card.listId, card.title, card.description, card.position, this.boardId],
    );
  }

  async updateContent(cardId: string, title: string, description: string | null, dueDate: string | null): Promise<void> {
    await this.manager.query(
      `UPDATE cards c
          SET title = $2, description = $3, due_date = $5::date, updated_at = now()
         FROM lists l
        WHERE c.id = $1 AND l.id = c.list_id AND l.board_id = $4`,
      [cardId, title, description, this.boardId, dueDate],
    );
  }

  async moveWithinList(cardId: string, listId: string, from: number, to: number): Promise<void> {
    await this.manager.query(
      `UPDATE cards c
          SET position = CASE
                WHEN c.id = $1 THEN $4::int
                WHEN $4::int > $3::int THEN c.position - 1
                ELSE c.position + 1
              END,
              updated_at = now()
         FROM lists l
        WHERE l.id = c.list_id
          AND c.list_id = $2
          AND l.board_id = $5
          AND c.position BETWEEN LEAST($3::int, $4::int) AND GREATEST($3::int, $4::int)`,
      [cardId, listId, from, to, this.boardId],
    );
  }

  async openGap(listId: string, fromPosition: number): Promise<void> {
    await this.manager.query(
      `UPDATE cards c
          SET position = c.position + 1, updated_at = now()
         FROM lists l
        WHERE l.id = c.list_id AND c.list_id = $1 AND l.board_id = $2 AND c.position >= $3`,
      [listId, this.boardId, fromPosition],
    );
  }

  async relocate(cardId: string, toListId: string, toPosition: number): Promise<void> {
    // Both the card and the destination must belong to the locked board (D23).
    await this.manager.query(
      `UPDATE cards c
          SET list_id = target.id, position = $3, updated_at = now()
         FROM lists source, lists target
        WHERE c.id = $1
          AND source.id = c.list_id AND source.board_id = $4
          AND target.id = $2 AND target.board_id = $4`,
      [cardId, toListId, toPosition, this.boardId],
    );
  }

  async closeGap(listId: string, afterPosition: number): Promise<void> {
    await this.manager.query(
      `UPDATE cards c
          SET position = c.position - 1, updated_at = now()
         FROM lists l
        WHERE l.id = c.list_id AND c.list_id = $1 AND l.board_id = $2 AND c.position > $3`,
      [listId, this.boardId, afterPosition],
    );
  }

  async remove(cardId: string): Promise<void> {
    await this.manager.query(
      `DELETE FROM cards c USING lists l WHERE c.id = $1 AND l.id = c.list_id AND l.board_id = $2`,
      [cardId, this.boardId],
    );
  }

  listsWithCards(listIds: readonly string[]): Promise<ListWithCards[]> {
    return loadListsWithCards(this.manager, this.boardId, listIds);
  }

  async readCard(cardId: string): Promise<CardDetail | null> {
    const rows: CardDetailRow[] = await this.manager.query(`${CARD_DETAIL_SELECT} WHERE c.id = $1 AND l.board_id = $2`, [
      cardId,
      this.boardId,
    ]);
    const row = rows[0];
    if (!row) return null;
    return toCardDetail(
      row,
      await loadChecklistItems(this.manager, row.id),
      await loadAssignees(this.manager, row.id),
      await loadCardLabelIds(this.manager, row.id),
      await loadComments(this.manager, row.id),
    );
  }
}

export class TypeOrmBoardCardRepository implements BoardCardRepository {
  constructor(private readonly dataSource: DataSource) {}

  withBoardLock<T>(
    scope: BoardScope,
    boardId: string,
    work: (tx: CardTransaction, role: BoardRole) => Promise<T>,
  ): Promise<LockResult<T>> {
    return runInBoardLock(this.dataSource, scope, boardId, (manager, role) =>
      work(new TypeOrmCardTransaction(manager, boardId), role),
    );
  }

  async findCard(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
  ): Promise<{ boardFound: boolean; card: CardDetail | null }> {
    const members: Array<{ board_id: string }> = await this.dataSource.query(
      `SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, scope.userId],
    );
    if (members.length === 0) return { boardFound: false, card: null };
    if (cardId === null) return { boardFound: true, card: null };

    const rows: CardDetailRow[] = await this.dataSource.query(
      `${CARD_DETAIL_SELECT}
         JOIN board_members m ON m.board_id = l.board_id AND m.user_id = $3
        WHERE c.id = $1 AND l.board_id = $2`,
      [cardId, boardId, scope.userId],
    );
    const row = rows[0];
    if (!row) return { boardFound: true, card: null };
    const manager = this.dataSource.manager;
    return {
      boardFound: true,
      card: toCardDetail(
        row,
        await loadChecklistItems(manager, row.id),
        await loadAssignees(manager, row.id),
        await loadCardLabelIds(manager, row.id),
        await loadComments(manager, row.id),
      ),
    };
  }
}
