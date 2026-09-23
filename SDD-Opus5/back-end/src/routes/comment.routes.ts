import { Router } from "express";
import type { CommentController } from "../controllers/CommentController";
import { validate } from "../middlewares/validate";
import { parseCommentInput } from "../schemas/comment.schemas";

/** Mounted under /api/boards/:boardId/cards/:cardId/comments, after authenticate and validateBoardId (RF09 plan 4.2). */
export function commentRoutes(controller: CommentController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", validate(parseCommentInput), controller.create);
  router.patch("/:commentId", validate(parseCommentInput), controller.update);
  router.delete("/:commentId", controller.delete);
  return router;
}
