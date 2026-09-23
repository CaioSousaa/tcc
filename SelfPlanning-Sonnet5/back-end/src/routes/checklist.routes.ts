import { Router } from "express";
import {
  createChecklistItemHandler,
  deleteChecklistItemHandler,
  listChecklistItemsHandler,
  updateChecklistItemHandler,
} from "../controllers/checklist.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const checklistRoutes = Router({ mergeParams: true });

checklistRoutes.use(authMiddleware);

checklistRoutes.post("/", createChecklistItemHandler);
checklistRoutes.get("/", listChecklistItemsHandler);
checklistRoutes.patch("/:itemId", updateChecklistItemHandler);
checklistRoutes.delete("/:itemId", deleteChecklistItemHandler);
