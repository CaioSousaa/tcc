import { Router } from "express";
import {
  createCard,
  deleteCard,
  listCards,
  updateCard,
} from "../controllers/card.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const cardRouter = Router({ mergeParams: true });

cardRouter.use(requireAuth);

cardRouter.get("/", listCards);
cardRouter.post("/", createCard);
cardRouter.patch("/:id", updateCard);
cardRouter.delete("/:id", deleteCard);
