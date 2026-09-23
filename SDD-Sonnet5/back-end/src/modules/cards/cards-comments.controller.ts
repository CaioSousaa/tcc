import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { CardsCommentsService } from "./cards-comments.service";
import { createCommentSchema, formatZodError } from "./cards-comments.schemas";
import { CommentWithAuthor } from "./repositories/comment.repository.types";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeComment(comment: CommentWithAuthor) {
  return {
    id: comment.id,
    text: comment.text,
    cardId: comment.cardId,
    author: comment.author,
    createdAt: comment.createdAt,
  };
}

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

function routeParams(req: Request) {
  return {
    boardId: req.params["boardId"] as string,
    listId: req.params["listId"] as string,
    cardId: req.params["cardId"] as string,
  };
}

export function buildCardsCommentsController(service: CardsCommentsService) {
  const create = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const comment = await service.create(userId, boardId, listId, cardId, parsed.data);
    res.status(201).json(serializeComment(comment));
  });

  const list = asyncHandler(async (req, res) => {
    const userId = requireUserId(req);
    const { boardId, listId, cardId } = routeParams(req);
    const comments = await service.list(userId, boardId, listId, cardId);
    res.status(200).json({ comments: comments.map(serializeComment) });
  });

  return { create, list };
}
