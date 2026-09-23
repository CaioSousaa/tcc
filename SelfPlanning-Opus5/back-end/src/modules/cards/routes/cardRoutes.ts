import { Router } from "express";
import { create, destroy, index, move, update } from "../controllers/cardController";
import { checklistRoutes } from "../../checklists/routes/checklistRoutes";
import { assigneeRoutes } from "../../members/routes/assigneeRoutes";
import { cardLabelRoutes } from "../../labels/routes/cardLabelRoutes";
import { commentRoutes } from "../../comments/routes/commentRoutes";

export const cardRoutes = Router({ mergeParams: true });

cardRoutes.post("/", create);
cardRoutes.get("/", index);
cardRoutes.put("/:id", update);
cardRoutes.patch("/:id/position", move);
cardRoutes.delete("/:id", destroy);

cardRoutes.use("/:cardId/checklist", checklistRoutes);
cardRoutes.use("/:cardId/assignees", assigneeRoutes);
cardRoutes.use("/:cardId/labels", cardLabelRoutes);
cardRoutes.use("/:cardId/comments", commentRoutes);
