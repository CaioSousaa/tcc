import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { CardNotFoundError } from "../services/card.service";
import { NotBoardMemberError } from "../services/board-member.service";
import {
  CommentNotFoundError,
  NotCommentAuthorOrAdminError,
  createComment,
  deleteComment,
  listComments,
} from "../services/comment.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof NotBoardMemberError) {
    res.status(403).json({ message: "Você não é membro deste quadro" });
    return true;
  }
  if (error instanceof CardNotFoundError) {
    res.status(404).json({ message: "Card não encontrado" });
    return true;
  }
  if (error instanceof CommentNotFoundError) {
    res.status(404).json({ message: "Comentário não encontrado" });
    return true;
  }
  if (error instanceof NotCommentAuthorOrAdminError) {
    res.status(403).json({
      message: "Apenas o autor do comentário ou um administrador do quadro pode excluí-lo",
    });
    return true;
  }
  return false;
}

function toCommentResponse(comment: {
  id: string;
  text: string;
  createdAt: Date;
  authorId: string;
  author: { id: string; name: string; email: string };
}) {
  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    author: { id: comment.author.id, name: comment.author.name, email: comment.author.email },
  };
}

export async function createCommentHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { text } = req.body ?? {};

  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ message: "Texto do comentário é obrigatório" });
    return;
  }

  try {
    const comment = await createComment(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      text.trim()
    );
    const comments = await listComments(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    const withAuthor = comments.find((c) => c.id === comment.id);
    res.status(201).json(withAuthor ? toCommentResponse(withAuthor) : comment);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listCommentsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const comments = await listComments(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(200).json(comments.map(toCommentResponse));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function deleteCommentHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await deleteComment(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      req.params.commentId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
