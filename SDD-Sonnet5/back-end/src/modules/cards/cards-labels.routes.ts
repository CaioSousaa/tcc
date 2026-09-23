import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildCardsLabelsController } from "./cards-labels.controller";
import { CardsLabelsService } from "./cards-labels.service";

export function buildCardsLabelsRouter(service: CardsLabelsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildCardsLabelsController(service);

  router.use(authenticate);

  router.post("/", controller.associate);
  router.delete("/:labelId", controller.dissociate);

  return router;
}
