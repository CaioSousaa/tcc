import { Router } from "express";
import {
  createLabel,
  deleteLabel,
  listLabels,
} from "../controllers/label.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const labelRouter = Router({ mergeParams: true });

labelRouter.use(requireAuth);

labelRouter.get("/", listLabels);
labelRouter.post("/", createLabel);
labelRouter.delete("/:id", deleteLabel);
