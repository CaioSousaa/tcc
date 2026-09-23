import { randomUUID } from "node:crypto";
import { COMMENTS_MAX, type CommentView } from "../domain/comments";
import { assertCan, can, type BoardRole } from "../domain/permissions";
import { AppError } from "../errors/AppError";
import type { CommentRecord, CommentRepository, CommentTransaction } from "../repositories/CommentRepository";
import type { CardLockResult } from "../repositories/cardLock";
import { isUuid } from "../schemas/board.schemas";
import type { CommentInput } from "../schemas/comment.schemas";
import { boardScopeFor } from "./boardAccess";

export type CommentsResult = { comments: CommentView[] };
export type CommentMutationResult = { comment: CommentView; comments: CommentView[] };

function unwrap<T>(result: CardLockResult<T>): T {
  if (result.status === "board-not-found") throw new AppError("BOARD_NOT_FOUND");
  if (result.status === "card-not-found") throw new AppError("CARD_NOT_FOUND");
  return result.value;
}

function pick(comments: CommentView[], commentId: string): CommentView {
  const comment = comments.find((item) => item.id === commentId);
  if (!comment) throw new Error("Comment missing right after a write");
  return comment;
}

/**
 * Comments of a card (RF09 plan 2.4). Writes run under the card lock: participation,
 * card, "comments.write", comment, then authorship or moderation (F120, F121).
 */
export class CommentService {
  constructor(private readonly repository: CommentRepository) {}

  private async inCard<T>(
    userId: string,
    boardId: string,
    cardId: string,
    work: (tx: CommentTransaction, role: BoardRole) => Promise<T>,
  ): Promise<T> {
    const result = await this.repository.withCardLock(
      boardScopeFor(userId),
      boardId,
      isUuid(cardId) ? cardId : null,
      (tx, role) => {
        assertCan(role, "comments.write");
        return work(tx, role);
      },
    );
    return unwrap(result);
  }

  /** Malformed ids, missing comments and comments of another card are all "not found" (CA28, CB06). */
  private static async requireComment(tx: CommentTransaction, commentId: string): Promise<CommentRecord> {
    if (!isUuid(commentId)) throw new AppError("COMMENT_NOT_FOUND");
    const comment = await tx.findComment(commentId);
    if (!comment) throw new AppError("COMMENT_NOT_FOUND");
    return comment;
  }

  async list(userId: string, boardId: string, cardId: string): Promise<CommentView[]> {
    return unwrap(await this.repository.findComments(boardScopeFor(userId), boardId, isUuid(cardId) ? cardId : null));
  }

  /** Author from the session, moment from the database, within 500 comments (RN02, RN08). */
  create(userId: string, boardId: string, cardId: string, input: CommentInput): Promise<CommentMutationResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      if ((await tx.count()) >= COMMENTS_MAX) throw new AppError("COMMENT_LIMIT_REACHED");
      const id = randomUUID();
      await tx.insert({ id, authorId: userId, body: input.body });
      const comments = await tx.listComments();
      return { comment: pick(comments, id), comments };
    });
  }

  /** Only the author; the same text writes nothing and does not mark as edited (RN05, RN06). */
  update(
    userId: string,
    boardId: string,
    cardId: string,
    commentId: string,
    input: CommentInput,
  ): Promise<CommentMutationResult> {
    return this.inCard(userId, boardId, cardId, async (tx) => {
      const comment = await CommentService.requireComment(tx, commentId);
      if (comment.authorId !== userId) throw new AppError("FORBIDDEN");
      if (comment.body !== input.body) await tx.updateBody(comment.id, input.body);
      const comments = await tx.listComments();
      return { comment: pick(comments, comment.id), comments };
    });
  }

  /** The author, or a role that moderates comments (RN05, RN07). */
  delete(userId: string, boardId: string, cardId: string, commentId: string): Promise<CommentsResult> {
    return this.inCard(userId, boardId, cardId, async (tx, role) => {
      const comment = await CommentService.requireComment(tx, commentId);
      if (comment.authorId !== userId && !can(role, "comments.moderate")) throw new AppError("FORBIDDEN");
      await tx.delete(comment.id);
      return { comments: await tx.listComments() };
    });
  }
}
