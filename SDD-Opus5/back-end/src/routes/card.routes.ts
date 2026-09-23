import { Router } from "express";
import type { AssigneeController } from "../controllers/AssigneeController";
import type { CardController } from "../controllers/CardController";
import type { CardLabelController } from "../controllers/CardLabelController";
import type { CommentController } from "../controllers/CommentController";
import type { ChecklistController } from "../controllers/ChecklistController";
import { validate } from "../middlewares/validate";
import { parseCreateCardInput, parseUpdateCardInput } from "../schemas/card.schemas";
import { assigneeRoutes } from "./assignee.routes";
import { checklistRoutes } from "./checklist.routes";
import { commentRoutes } from "./comment.routes";
import { cardLabelRoutes } from "./label.routes";

/** Mounted under /api/boards/:boardId/lists/:listId/cards, after authenticate and validateBoardId. */
export function listCardRoutes(controller: CardController): Router {
  const router = Router({ mergeParams: true });
  router.post("/", validate(parseCreateCardInput), controller.create);
  return router;
}

/** Mounted under /api/boards/:boardId/cards, after authenticate and validateBoardId. */
export function cardRoutes(
  controller: CardController,
  checklistController: ChecklistController,
  assigneeController: AssigneeController,
  cardLabelController: CardLabelController,
  commentController: CommentController,
): Router {
  const router = Router({ mergeParams: true });
  router.get("/:cardId", controller.get);
  router.patch("/:cardId", validate(parseUpdateCardInput), controller.update);
  router.delete("/:cardId", controller.delete);
  router.use("/:cardId/checklist-items", checklistRoutes(checklistController));
  router.use("/:cardId/assignees", assigneeRoutes(assigneeController));
  router.use("/:cardId/labels", cardLabelRoutes(cardLabelController));
  router.use("/:cardId/comments", commentRoutes(commentController));
  return router;
}
