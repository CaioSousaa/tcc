import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildListsController } from "./lists.controller";
import { ListsService } from "./lists.service";

export function buildListsRouter(service: ListsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildListsController(service);

  router.use(authenticate);

  router.post("/", controller.create);
  router.get("/", controller.list);
  router.patch("/:listId", controller.update);
  router.delete("/:listId", controller.remove);

  return router;
}
