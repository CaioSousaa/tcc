import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildChecklistsController } from "./checklists.controller";
import { ChecklistsService } from "./checklists.service";

export function buildChecklistsRouter(service: ChecklistsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildChecklistsController(service);

  router.use(authenticate);

  router.post("/", controller.createChecklist);
  router.get("/", controller.listChecklists);
  router.delete("/:checklistId", controller.deleteChecklist);
  router.post("/:checklistId/items", controller.createItem);
  router.patch("/:checklistId/items/:itemId", controller.updateItem);
  router.delete("/:checklistId/items/:itemId", controller.deleteItem);

  return router;
}
