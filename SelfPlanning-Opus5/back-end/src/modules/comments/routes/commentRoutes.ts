import { Router } from "express";
import { create, destroy, index, update } from "../controllers/commentController";

export const commentRoutes = Router({ mergeParams: true });

commentRoutes.post("/", create);
commentRoutes.get("/", index);
commentRoutes.put("/:commentId", update);
commentRoutes.delete("/:commentId", destroy);
