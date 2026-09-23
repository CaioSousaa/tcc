import { Router } from "express";
import { create, destroy, index, toggle, update } from "../controllers/checklistController";

export const checklistRoutes = Router({ mergeParams: true });

checklistRoutes.post("/", create);
checklistRoutes.get("/", index);
checklistRoutes.put("/:itemId", update);
checklistRoutes.patch("/:itemId/done", toggle);
checklistRoutes.delete("/:itemId", destroy);
