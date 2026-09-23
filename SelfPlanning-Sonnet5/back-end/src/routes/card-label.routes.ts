import { Router } from "express";
import {
  addLabelToCardHandler,
  listCardLabelsHandler,
  removeLabelFromCardHandler,
} from "../controllers/card-label.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const cardLabelRoutes = Router({ mergeParams: true });

cardLabelRoutes.use(authMiddleware);

cardLabelRoutes.post("/", addLabelToCardHandler);
cardLabelRoutes.get("/", listCardLabelsHandler);
cardLabelRoutes.delete("/:labelId", removeLabelFromCardHandler);
