import type { NextFunction, Request, Response } from "express";
import { boardIdSchema } from "../schemas/board.schema";
import {
  commentIdSchema,
  createCommentSchema,
} from "../schemas/comment.schema";
import { commentService } from "../services/CommentService";
import { validate } from "../utils/validation";

function boardIdFrom(req: Request): string {
  return validate(boardIdSchema, req.params["boardId"]);
}

export class CommentController {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const comments = await commentService.list(
        req.userId!,
        boardIdFrom(req),
      );

      res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  }

  async store(req: Request, res: Response, next: NextFunction) {
    try {
      const input = validate(createCommentSchema, req.body);
      const comment = await commentService.create(
        req.userId!,
        boardIdFrom(req),
        input,
      );

      res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  }

  async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      const commentId = validate(commentIdSchema, req.params["commentId"]);
      await commentService.remove(req.userId!, boardIdFrom(req), commentId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
