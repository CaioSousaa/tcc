import { Router } from "express";
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  updateChecklistItem,
} from "../controllers/checklist-item.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const checklistItemRouter = Router({ mergeParams: true });

checklistItemRouter.use(requireAuth);

checklistItemRouter.get("/", listChecklistItems);
checklistItemRouter.post("/", createChecklistItem);
checklistItemRouter.patch("/:id", updateChecklistItem);
checklistItemRouter.delete("/:id", deleteChecklistItem);
