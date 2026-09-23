import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import { buildLabelsController } from "./labels.controller";
import { LabelsService } from "./labels.service";

export function buildLabelsRouter(service: LabelsService): Router {
  const router = Router({ mergeParams: true });
  const controller = buildLabelsController(service);

  router.use(authenticate);

  router.post("/", controller.create);
  router.get("/", controller.list);
  router.patch("/:labelId", controller.update);
  router.delete("/:labelId", controller.remove);

  return router;
}
