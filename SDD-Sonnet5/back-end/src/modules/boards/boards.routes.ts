import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildBoardsController } from "./boards.controller";
import { BoardsService } from "./boards.service";

export function buildBoardsRouter(service: BoardsService): Router {
  const router = Router();
  const controller = buildBoardsController(service);

  router.use(authenticate);

  router.post("/", controller.create);
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}
