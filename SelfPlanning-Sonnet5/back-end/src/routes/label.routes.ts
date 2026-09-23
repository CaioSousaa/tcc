import { Router } from "express";
import {
  createLabelHandler,
  deleteLabelHandler,
  listLabelsHandler,
  updateLabelHandler,
} from "../controllers/label.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const labelRoutes = Router({ mergeParams: true });

labelRoutes.use(authMiddleware);

labelRoutes.post("/", createLabelHandler);
labelRoutes.get("/", listLabelsHandler);
labelRoutes.patch("/:labelId", updateLabelHandler);
labelRoutes.delete("/:labelId", deleteLabelHandler);
