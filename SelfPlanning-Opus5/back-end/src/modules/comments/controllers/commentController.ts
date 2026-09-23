import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { requireCommentText } from "../commentValidation";
import {
  CommentScope,
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "../services/commentService";

function scopeFrom(request: Request): CommentScope {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return {
    boardId: requireUuid(request.params.boardId, "boardId"),
    cardId: requireUuid(request.params.cardId, "cardId"),
    userId: authenticated.id,
  };
}

export async function create(request: Request, response: Response): Promise<void> {
  const comments = await createComment({
    ...scopeFrom(request),
    text: requireCommentText(request.body?.text),
  });

  response.status(201).json({ comments });
}

export async function index(request: Request, response: Response): Promise<void> {
  const comments = await listComments(scopeFrom(request));

  response.status(200).json({ comments });
}

export async function update(request: Request, response: Response): Promise<void> {
  const comments = await updateComment({
    ...scopeFrom(request),
    commentId: requireUuid(request.params.commentId, "commentId"),
    text: requireCommentText(request.body?.text),
  });

  response.status(200).json({ comments });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const comments = await deleteComment({
    ...scopeFrom(request),
    commentId: requireUuid(request.params.commentId, "commentId"),
  });

  response.status(200).json({ comments });
}
