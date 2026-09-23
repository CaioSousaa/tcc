import { AppDataSource } from "../config/data-source";
import { Comment } from "../entities/Comment";
import { findBoardById } from "./board.service";
import { getCardInBoard } from "./card.service";
import { requireAdmin, requireMember } from "./board-member.service";

const commentRepository = () => AppDataSource.getRepository(Comment);

export class CommentNotFoundError extends Error {}
export class NotCommentAuthorOrAdminError extends Error {}

async function ensureCardAccess(requesterId: string, boardId: string, cardId: string) {
  await findBoardById(boardId);
  await requireMember(boardId, requesterId);
  return getCardInBoard(boardId, cardId);
}

export async function createComment(
  requesterId: string,
  boardId: string,
  cardId: string,
  text: string
): Promise<Comment> {
  await ensureCardAccess(requesterId, boardId, cardId);

  const comment = commentRepository().create({ cardId, authorId: requesterId, text });
  return commentRepository().save(comment);
}

export async function listComments(
  requesterId: string,
  boardId: string,
  cardId: string
): Promise<Comment[]> {
  await ensureCardAccess(requesterId, boardId, cardId);

  return commentRepository().find({
    where: { cardId },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });
}

export async function deleteComment(
  requesterId: string,
  boardId: string,
  cardId: string,
  commentId: string
): Promise<void> {
  await ensureCardAccess(requesterId, boardId, cardId);

  const comment = await commentRepository().findOne({ where: { id: commentId, cardId } });
  if (!comment) {
    throw new CommentNotFoundError();
  }

  if (comment.authorId !== requesterId) {
    try {
      await requireAdmin(boardId, requesterId);
    } catch {
      throw new NotCommentAuthorOrAdminError();
    }
  }

  await commentRepository().remove(comment);
}
