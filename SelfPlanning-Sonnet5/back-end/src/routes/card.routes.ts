import { Router } from "express";
import {
  createCardHandler,
  deleteCardHandler,
  getCardHandler,
  listCardsHandler,
  moveCardHandler,
  updateCardHandler,
} from "../controllers/card.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const cardsInListRoutes = Router({ mergeParams: true });
cardsInListRoutes.use(authMiddleware);
cardsInListRoutes.post("/", createCardHandler);
cardsInListRoutes.get("/", listCardsHandler);

export const cardDetailRoutes = Router({ mergeParams: true });
cardDetailRoutes.use(authMiddleware);
cardDetailRoutes.get("/:cardId", getCardHandler);
cardDetailRoutes.patch("/:cardId", updateCardHandler);
cardDetailRoutes.patch("/:cardId/move", moveCardHandler);
cardDetailRoutes.delete("/:cardId", deleteCardHandler);
