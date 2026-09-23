import { Router } from "express";
import { cardLabelController } from "../controllers/CardLabelController";

/** Mounted under /boards/:boardId/card-labels, so board params must be inherited. */
export const cardLabelRoutes = Router({ mergeParams: true });

cardLabelRoutes.get("/", (req, res, next) =>
  cardLabelController.index(req, res, next),
);
cardLabelRoutes.post("/", (req, res, next) =>
  cardLabelController.store(req, res, next),
);
cardLabelRoutes.delete("/:cardLabelId", (req, res, next) =>
  cardLabelController.destroy(req, res, next),
);
