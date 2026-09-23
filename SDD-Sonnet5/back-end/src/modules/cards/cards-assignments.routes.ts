import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildCardsAssignmentsController } from "./cards-assignments.controller";
import { CardsAssignmentsService } from "./cards-assignments.service";

export function buildCardsAssignmentsRouter(service: CardsAssignmentsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildCardsAssignmentsController(service);

  router.use(authenticate);

  router.post("/", controller.assign);
  router.delete("/:userId", controller.unassign);

  return router;
}
