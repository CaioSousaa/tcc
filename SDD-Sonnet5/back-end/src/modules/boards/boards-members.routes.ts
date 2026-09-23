import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildBoardsMembersController } from "./boards-members.controller";
import { BoardsMembersService } from "./boards-members.service";

export function buildBoardsMembersRouter(service: BoardsMembersService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildBoardsMembersController(service);

  router.use(authenticate);

  router.post("/", controller.invite);
  router.get("/", controller.list);
  router.delete("/me", controller.leave);
  router.patch("/:memberId", controller.updateRole);
  router.delete("/:memberId", controller.remove);

  return router;
}
