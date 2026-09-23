import { AppError } from "../../../shared/errors/AppError";
import { findBoardAccess } from "../../boards/services/boardService";
import { findOwnedCard } from "../../cards/services/cardService";
import { CommentView, toCommentView } from "../commentView";
import { Comment } from "../entities/Comment";
import { commentRepository } from "../repositories/commentRepository";

export interface CommentScope {
  boardId: string;
  userId: string;
  cardId: string;
}

export interface CreateCommentRequest extends CommentScope {
  text: string;
}

export interface UpdateCommentRequest extends CommentScope {
  commentId: string;
  text: string;
}

export interface DeleteCommentRequest extends CommentScope {
  commentId: string;
}

async function historyOf(cardId: string): Promise<CommentView[]> {
  const comments = await commentRepository().find({
    where: { cardId },
    relations: { author: true },
    order: { createdAt: "ASC" },
  });

  return comments.map(toCommentView);
}

async function findCommentOfCard(commentId: string, cardId: string): Promise<Comment> {
  const comment = await commentRepository().findOne({ where: { id: commentId } });

  if (!comment || comment.cardId !== cardId) {
    throw new AppError("Comentário não encontrado", 404);
  }

  return comment;
}

export async function createComment(data: CreateCommentRequest): Promise<CommentView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const repository = commentRepository();

  await repository.save(
    repository.create({
      cardId: data.cardId,
      authorId: data.userId,
      text: data.text,
      edited: false,
    })
  );

  return historyOf(data.cardId);
}

export async function listComments(scope: CommentScope): Promise<CommentView[]> {
  await findOwnedCard(scope.cardId, scope.boardId, scope.userId);

  return historyOf(scope.cardId);
}

export async function updateComment(data: UpdateCommentRequest): Promise<CommentView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const comment = await findCommentOfCard(data.commentId, data.cardId);

  if (comment.authorId !== data.userId) {
    throw new AppError("Só o autor pode editar o próprio comentário", 403);
  }

  if (comment.text !== data.text) {
    comment.text = data.text;
    comment.edited = true;

    await commentRepository().save(comment);
  }

  return historyOf(data.cardId);
}

export async function deleteComment(data: DeleteCommentRequest): Promise<CommentView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const comment = await findCommentOfCard(data.commentId, data.cardId);

  const { member } = await findBoardAccess(data.boardId, data.userId);

  if (comment.authorId !== data.userId && member.role !== "admin") {
    throw new AppError("Só o autor ou um administrador do quadro pode excluir o comentário", 403);
  }

  await commentRepository().remove(comment);

  return historyOf(data.cardId);
}
