import type { DataSource, EntityManager } from "typeorm";
import type { CommentView } from "../domain/comments";
import type { BoardRole } from "../domain/permissions";
import type { BoardScope } from "./BoardRepository";
import { runInCardLock, type CardLockResult } from "./cardLock";
import { loadComments } from "./comments";

export type CommentRecord = { id: string; authorId: string; body: string };

/** Primitive operations on the comments of one locked card, without rules (RF09 plan 2.3, F125). */
export interface CommentTransaction {
  count(): Promise<number>;
  /** `null` when the comment does not belong to this card (CA28, N188). */
  findComment(commentId: string): Promise<CommentRecord | null>;
  /** The moment is set by the database (RN02, F122). */
  insert(comment: CommentRecord): Promise<void>;
  /** Writes the text and marks the comment as edited (D44). */
  updateBody(commentId: string, body: string): Promise<void>;
  delete(commentId: string): Promise<void>;
  listComments(): Promise<CommentView[]>;
}

export interface CommentRepository {
  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CommentTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>>;
  /** Read without lock, scoped by participation and board (RF09 2.4 "Listar"). */
  findComments(scope: BoardScope, boardId: string, cardId: string | null): Promise<CardLockResult<CommentView[]>>;
}

class TypeOrmCommentTransaction implements CommentTransaction {
  constructor(
    private readonly manager: EntityManager,
    private readonly cardId: string,
  ) {}

  async count(): Promise<number> {
    const rows: Array<{ total: number }> = await this.manager.query(
      `SELECT count(*)::int AS total FROM card_comments WHERE card_id = $1`,
      [this.cardId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findComment(commentId: string): Promise<CommentRecord | null> {
    const rows: Array<{ id: string; author_id: string; body: string }> = await this.manager.query(
      `SELECT id, author_id, body FROM card_comments WHERE id = $1 AND card_id = $2`,
      [commentId, this.cardId],
    );
    const row = rows[0];
    return row ? { id: row.id, authorId: row.author_id, body: row.body } : null;
  }

  async insert(comment: CommentRecord): Promise<void> {
    await this.manager.query(`INSERT INTO card_comments (id, card_id, author_id, body) VALUES ($1, $2, $3, $4)`, [
      comment.id,
      this.cardId,
      comment.authorId,
      comment.body,
    ]);
  }

  async updateBody(commentId: string, body: string): Promise<void> {
    await this.manager.query(
      `UPDATE card_comments SET body = $3, edited_at = now() WHERE id = $1 AND card_id = $2`,
      [commentId, this.cardId, body],
    );
  }

  async delete(commentId: string): Promise<void> {
    await this.manager.query(`DELETE FROM card_comments WHERE id = $1 AND card_id = $2`, [commentId, this.cardId]);
  }

  listComments(): Promise<CommentView[]> {
    return loadComments(this.manager, this.cardId);
  }
}

export class TypeOrmCommentRepository implements CommentRepository {
  constructor(private readonly dataSource: DataSource) {}

  withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CommentTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    return runInCardLock(this.dataSource, scope, boardId, cardId, (manager, role) =>
      // cardId is non-null whenever work runs.
      work(new TypeOrmCommentTransaction(manager, cardId ?? ""), role),
    );
  }

  async findComments(scope: BoardScope, boardId: string, cardId: string | null): Promise<CardLockResult<CommentView[]>> {
    const members: Array<{ board_id: string }> = await this.dataSource.query(
      `SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2`,
      [boardId, scope.userId],
    );
    if (members.length === 0) return { status: "board-not-found" };
    if (cardId === null) return { status: "card-not-found" };

    const cards: Array<{ id: string }> = await this.dataSource.query(
      `SELECT c.id FROM cards c JOIN lists l ON l.id = c.list_id WHERE c.id = $1 AND l.board_id = $2`,
      [cardId, boardId],
    );
    if (cards.length === 0) return { status: "card-not-found" };
    return { status: "ok", value: await loadComments(this.dataSource, cardId) };
  }
}
