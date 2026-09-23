import { Router } from "express";
import type { AssigneeController } from "../controllers/AssigneeController";

/** Mounted under /api/boards/:boardId/cards/:cardId/assignees (RF07 plan 4.6). */
export function assigneeRoutes(controller: AssigneeController): Router {
  const router = Router({ mergeParams: true });
  router.put("/:userId", controller.assign);
  router.delete("/:userId", controller.unassign);
  return router;
}
