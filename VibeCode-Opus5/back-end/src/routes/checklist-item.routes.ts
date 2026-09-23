import { Router } from "express";
import { checklistItemController } from "../controllers/ChecklistItemController";

/** Mounted under /boards/:boardId/checklist-items, so board params must be inherited. */
export const checklistItemRoutes = Router({ mergeParams: true });

checklistItemRoutes.get("/", (req, res, next) =>
  checklistItemController.index(req, res, next),
);
checklistItemRoutes.post("/", (req, res, next) =>
  checklistItemController.store(req, res, next),
);
checklistItemRoutes.patch("/:itemId", (req, res, next) =>
  checklistItemController.update(req, res, next),
);
checklistItemRoutes.delete("/:itemId", (req, res, next) =>
  checklistItemController.destroy(req, res, next),
);
