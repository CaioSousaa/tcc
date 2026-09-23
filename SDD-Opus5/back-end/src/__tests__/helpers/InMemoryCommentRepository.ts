import type { CommentView } from "../../domain/comments";
import type { BoardRole } from "../../domain/permissions";
import type { BoardScope } from "../../repositories/BoardRepository";
import type { CardLockResult } from "../../repositories/cardLock";
import type { CommentRecord, CommentRepository, CommentTransaction } from "../../repositories/CommentRepository";
import type { InMemoryBoardRepository } from "./InMemoryBoardRepository";

/**
 * In-memory stand-in for runInCardLock with comment primitives (RF09 N198): one
 * queue per card, primitives filtered by card, the 2000-character CHECK and
 * rollback of comments on error.
 */
export class InMemoryCommentRepository implements CommentRepository {
  private readonly queues = new Map<string, Promise<unknown>>();
  readonly calls: string[][] = [];
  failOn: keyof CommentTransaction | null = null;

  constructor(private readonly store: InMemoryBoardRepository) {}

  async withCardLock<T>(
    scope: BoardScope,
    boardId: string,
    cardId: string | null,
    work: (tx: CommentTransaction, role: BoardRole) => Promise<T>,
  ): Promise<CardLockResult<T>> {
    const role = this.store.roleOf(scope, boardId);
    if (!role) return { status: "board-not-found" };
    if (cardId === null) return { status: "card-not-found" };

    const previous = this.queues.get(cardId) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(cardId, previous.then(() => current));
    await previous;

    try {
      // The role is read after the lock is taken (RF07 F81).
      const lockedRole = this.store.roleOf(scope, boardId);
      if (!lockedRole) return { status: "board-not-found" };
      if (this.store.boardOfCard(cardId) !== boardId) return { status: "card-not-found" };
      const snapshot = new Map([...this.store.comments].map(([id, row]) => [id, { ...row }]));
      const calls: string[] = [];
      this.calls.push(calls);
      try {
        return { status: "ok", value: await work(this.transaction(cardId, calls), lockedRole) };
      } catch (error) {
        this.store.comments.clear();
        for (const [id, row] of snapshot) this.store.comments.set(id, row);
        throw error;
      }
    } finally {
      release();
    }
  }

  async findComments(scope: BoardScope, boardId: string, cardId: string | null): Promise<CardLockResult<CommentView[]>> {
    if (!this.store.roleOf(scope, boardId)) return { status: "board-not-found" };
    if (cardId === null || this.store.boardOfCard(cardId) !== boardId) return { status: "card-not-found" };
    return { status: "ok", value: this.store.commentsOf(cardId) };
  }

  private transaction(cardId: string, calls: string[]): CommentTransaction {
    const store = this.store;
    const statement = async <T>(name: keyof CommentTransaction, run: () => T): Promise<T> => {
      calls.push(name);
      // Yield so that concurrent callers would interleave if the lock did not serialize them.
      await Promise.resolve();
      if (this.failOn === name) throw new Error(`${name} failed`);
      return run();
    };
    const own = (commentId: string) => {
      const row = store.comments.get(commentId);
      return row && row.cardId === cardId ? row : undefined;
    };
    const checkLength = (body: string) => {
      const length = Array.from(body).length;
      if (length < 1 || length > 2000) throw new Error('violates check constraint "CHK_card_comments_body_length"');
    };

    return {
      count: () => statement("count", () => store.commentsOf(cardId).length),
      findComment: (commentId) =>
        statement("findComment", (): CommentRecord | null => {
          const row = own(commentId);
          return row ? { id: row.id, authorId: row.authorId, body: row.body } : null;
        }),
      insert: (comment) =>
        statement("insert", () => {
          checkLength(comment.body);
          store.comments.set(comment.id, { ...comment, cardId, createdAt: store.now(), editedAt: null });
        }),
      updateBody: (commentId, body) =>
        statement("updateBody", () => {
          checkLength(body);
          const row = own(commentId);
          if (!row) return;
          row.body = body;
          row.editedAt = store.now();
        }),
      delete: (commentId) =>
        statement("delete", () => {
          if (own(commentId)) store.comments.delete(commentId);
        }),
      listComments: () => statement("listComments", () => store.commentsOf(cardId)),
    };
  }
}
