import { Router } from "express";
import {
  createListHandler,
  deleteListHandler,
  listListsHandler,
  renameListHandler,
  reorderListsHandler,
} from "../controllers/list.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const listRoutes = Router({ mergeParams: true });

listRoutes.use(authMiddleware);

listRoutes.post("/", createListHandler);
listRoutes.get("/", listListsHandler);
listRoutes.patch("/reorder", reorderListsHandler);
listRoutes.patch("/:listId", renameListHandler);
listRoutes.delete("/:listId", deleteListHandler);
