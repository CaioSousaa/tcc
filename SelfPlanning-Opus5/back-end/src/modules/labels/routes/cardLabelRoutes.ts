import { Router } from "express";
import { apply, unapply } from "../controllers/labelController";

export const cardLabelRoutes = Router({ mergeParams: true });

cardLabelRoutes.post("/", apply);
cardLabelRoutes.delete("/:labelId", unapply);
