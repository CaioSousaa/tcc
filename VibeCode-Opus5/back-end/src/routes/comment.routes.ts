import { Router } from "express";
import { commentController } from "../controllers/CommentController";

/** Mounted under /boards/:boardId/comments, so board params must be inherited. */
export const commentRoutes = Router({ mergeParams: true });

commentRoutes.get("/", (req, res, next) =>
  commentController.index(req, res, next),
);
commentRoutes.post("/", (req, res, next) =>
  commentController.store(req, res, next),
);
commentRoutes.delete("/:commentId", (req, res, next) =>
  commentController.destroy(req, res, next),
);
