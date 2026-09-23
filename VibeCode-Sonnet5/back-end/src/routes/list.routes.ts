import { Router } from "express";
import {
  createList,
  deleteList,
  listLists,
  renameList,
  reorderLists,
} from "../controllers/list.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const listRouter = Router({ mergeParams: true });

listRouter.use(requireAuth);

listRouter.get("/", listLists);
listRouter.post("/", createList);
listRouter.put("/reorder", reorderLists);
listRouter.patch("/:id", renameList);
listRouter.delete("/:id", deleteList);
