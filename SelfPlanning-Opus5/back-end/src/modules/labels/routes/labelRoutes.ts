import { Router } from "express";
import { create, destroy, index, update } from "../controllers/labelController";

export const labelRoutes = Router({ mergeParams: true });

labelRoutes.post("/", create);
labelRoutes.get("/", index);
labelRoutes.put("/:labelId", update);
labelRoutes.delete("/:labelId", destroy);
