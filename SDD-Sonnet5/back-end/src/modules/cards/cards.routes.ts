import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildCardsController } from "./cards.controller";
import { CardsService } from "./cards.service";

export function buildCardsRouter(service: CardsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildCardsController(service);

  router.use(authenticate);

  router.post("/", controller.create);
  router.get("/", controller.list);
  router.patch("/:cardId", controller.update);
  router.delete("/:cardId", controller.remove);

  return router;
}
