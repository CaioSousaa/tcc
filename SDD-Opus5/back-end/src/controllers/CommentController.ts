import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { CommentInput } from "../schemas/comment.schemas";
import type { CommentService } from "../services/CommentService";

/** The author always comes from the session (RF09 F122). */
function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "cardId" | "commentId"): string {
  return String(req.params[name]);
}

export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const comments = await this.commentService.list(currentUserId(req), param(req, "boardId"), param(req, "cardId"));
    res.status(200).json({ comments });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const result = await this.commentService.create(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      req.body as CommentInput,
    );
    res.status(201).json(result);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const result = await this.commentService.update(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "commentId"),
      req.body as CommentInput,
    );
    res.status(200).json(result);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const result = await this.commentService.delete(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "cardId"),
      param(req, "commentId"),
    );
    res.status(200).json(result);
  };
}
