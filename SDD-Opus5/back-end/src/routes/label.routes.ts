import { Router } from "express";
import type { CardLabelController } from "../controllers/CardLabelController";
import type { LabelController } from "../controllers/LabelController";
import { validate } from "../middlewares/validate";
import { parseLabelInput } from "../schemas/label.schemas";

/** Mounted under /api/boards/:boardId/labels, after authenticate and validateBoardId (RF08 plan 4.2). */
export function labelRoutes(controller: LabelController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.list);
  router.post("/", validate(parseLabelInput), controller.create);
  router.patch("/:labelId", validate(parseLabelInput), controller.update);
  router.delete("/:labelId", controller.delete);
  return router;
}

/** Mounted under /api/boards/:boardId/cards/:cardId/labels; no body is read (RF08 plan 4.3, A61). */
export function cardLabelRoutes(controller: CardLabelController): Router {
  const router = Router({ mergeParams: true });
  router.put("/:labelId", controller.apply);
  router.delete("/:labelId", controller.remove);
  return router;
}
