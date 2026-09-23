import { Router } from "express";
import { attachLabel, detachLabel } from "../controllers/card-label.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const cardLabelRouter = Router({ mergeParams: true });

cardLabelRouter.use(requireAuth);

cardLabelRouter.post("/", attachLabel);
cardLabelRouter.delete("/:labelId", detachLabel);
