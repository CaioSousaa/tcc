import { Router } from "express";
import { cardController } from "../controllers/CardController";

/** Mounted under /boards/:boardId/cards, so board params must be inherited. */
export const cardRoutes = Router({ mergeParams: true });

cardRoutes.get("/", (req, res, next) => cardController.index(req, res, next));
cardRoutes.post("/", (req, res, next) => cardController.store(req, res, next));
cardRoutes.patch("/:cardId", (req, res, next) =>
  cardController.update(req, res, next),
);
cardRoutes.delete("/:cardId", (req, res, next) =>
  cardController.destroy(req, res, next),
);
