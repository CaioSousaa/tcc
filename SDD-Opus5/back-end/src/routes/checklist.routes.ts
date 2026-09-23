import { Router } from "express";
import type { ChecklistController } from "../controllers/ChecklistController";
import { validate } from "../middlewares/validate";
import { parseCreateChecklistItemInput, parseUpdateChecklistItemInput } from "../schemas/checklist.schemas";

/** Mounted under /api/boards/:boardId/cards/:cardId/checklist-items, after authenticate and validateBoardId. */
export function checklistRoutes(controller: ChecklistController): Router {
  const router = Router({ mergeParams: true });
  router.post("/", validate(parseCreateChecklistItemInput), controller.add);
  router.patch("/:itemId", validate(parseUpdateChecklistItemInput), controller.update);
  router.delete("/:itemId", controller.remove);
  return router;
}
