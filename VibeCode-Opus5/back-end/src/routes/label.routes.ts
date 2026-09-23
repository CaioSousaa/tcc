import { Router } from "express";
import { labelController } from "../controllers/LabelController";

/** Mounted under /boards/:boardId/labels, so board params must be inherited. */
export const labelRoutes = Router({ mergeParams: true });

labelRoutes.get("/", (req, res, next) => labelController.index(req, res, next));
labelRoutes.post("/", (req, res, next) => labelController.store(req, res, next));
labelRoutes.patch("/:labelId", (req, res, next) =>
  labelController.update(req, res, next),
);
labelRoutes.delete("/:labelId", (req, res, next) =>
  labelController.destroy(req, res, next),
);
