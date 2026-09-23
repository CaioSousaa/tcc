import { Router, Request, Response, NextFunction } from "express";
import { CommentService } from "../services/CommentService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError, ForbiddenError } from "../types/errors";

const router = Router();
const commentService = new CommentService();

router.post(
  "/boards/:boardId/cards/:cardId/comments",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const { content } = req.body;
      const userId = req.userId!;

      if (!content) {
        next(new ValidationError("Comment content is required"));
        return;
      }

      const comment = await commentService.createComment(boardId, cardId, content, userId);

      res.status(201).json({
        id: comment.id,
        card_id: comment.card_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        edited_at: comment.edited_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("not an active member") ||
          error.message.includes("between 1 and 1000")
        ) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.get(
  "/cards/:cardId/comments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";

      const comments = await commentService.getCommentsOfCard(cardId);
      const total = await commentService.getCommentCount(cardId);

      res.json({
        comments,
        total,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/boards/:boardId/cards/:cardId/comments/:commentId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const commentId = typeof req.params.commentId === "string" ? req.params.commentId : "";
      const { content } = req.body;
      const userId = req.userId!;

      if (!content) {
        next(new ValidationError("Comment content is required"));
        return;
      }

      const comment = await commentService.updateComment(
        boardId,
        cardId,
        commentId,
        content,
        userId
      );

      res.json({
        id: comment.id,
        content: comment.content,
        updated_at: comment.updated_at,
        edited_at: comment.edited_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("between 1 and 1000")) {
          next(new ValidationError(error.message));
        } else if (
          error.message.includes("author") ||
          error.message.includes("admin/editor")
        ) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.delete(
  "/boards/:boardId/cards/:cardId/comments/:commentId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const cardId = typeof req.params.cardId === "string" ? req.params.cardId : "";
      const commentId = typeof req.params.commentId === "string" ? req.params.commentId : "";
      const userId = req.userId!;

      await commentService.deleteComment(boardId, cardId, commentId, userId);

      res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("author") ||
          error.message.includes("admin/editor")
        ) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("not found")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

export default router;
