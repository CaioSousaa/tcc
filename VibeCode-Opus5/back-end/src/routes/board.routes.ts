import { Router } from "express";
import { boardController } from "../controllers/BoardController";
import { authenticate } from "../middlewares/authenticate";
import { boardMemberRoutes } from "./board-member.routes";
import { cardAssigneeRoutes } from "./card-assignee.routes";
import { cardLabelRoutes } from "./card-label.routes";
import { cardRoutes } from "./card.routes";
import { checklistItemRoutes } from "./checklist-item.routes";
import { commentRoutes } from "./comment.routes";
import { labelRoutes } from "./label.routes";
import { listRoutes } from "./list.routes";

export const boardRoutes = Router();

boardRoutes.use(authenticate);

boardRoutes.get("/", (req, res, next) => boardController.index(req, res, next));
boardRoutes.get("/:id", (req, res, next) =>
  boardController.show(req, res, next),
);
boardRoutes.post("/", (req, res, next) => boardController.store(req, res, next));
boardRoutes.patch("/:id", (req, res, next) =>
  boardController.update(req, res, next),
);
boardRoutes.delete("/:id", (req, res, next) =>
  boardController.destroy(req, res, next),
);

boardRoutes.use("/:boardId/lists", listRoutes);
boardRoutes.use("/:boardId/cards", cardRoutes);
boardRoutes.use("/:boardId/checklist-items", checklistItemRoutes);
boardRoutes.use("/:boardId/members", boardMemberRoutes);
boardRoutes.use("/:boardId/card-assignees", cardAssigneeRoutes);
boardRoutes.use("/:boardId/labels", labelRoutes);
boardRoutes.use("/:boardId/card-labels", cardLabelRoutes);
boardRoutes.use("/:boardId/comments", commentRoutes);
