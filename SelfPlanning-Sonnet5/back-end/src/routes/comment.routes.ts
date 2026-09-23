import { Router } from "express";
import {
  createCommentHandler,
  deleteCommentHandler,
  listCommentsHandler,
} from "../controllers/comment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const commentRoutes = Router({ mergeParams: true });

commentRoutes.use(authMiddleware);

commentRoutes.post("/", createCommentHandler);
commentRoutes.get("/", listCommentsHandler);
commentRoutes.delete("/:commentId", deleteCommentHandler);
