import { Router } from "express";
import { createComment, listComments } from "../controllers/comment.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const commentRouter = Router({ mergeParams: true });

commentRouter.use(requireAuth);

commentRouter.get("/", listComments);
commentRouter.post("/", createComment);
