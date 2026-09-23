import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildCardsCommentsController } from "./cards-comments.controller";
import { CardsCommentsService } from "./cards-comments.service";

export function buildCardsCommentsRouter(service: CardsCommentsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildCardsCommentsController(service);

  router.use(authenticate);

  router.post("/", controller.create);
  router.get("/", controller.list);

  return router;
}
