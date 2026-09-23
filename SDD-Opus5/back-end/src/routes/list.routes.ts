import { Router } from "express";
import type { CardController } from "../controllers/CardController";
import type { ListController } from "../controllers/ListController";
import { validate, validateQuery } from "../middlewares/validate";
import { parseCreateListInput, parseDeleteListQuery, parseUpdateListInput } from "../schemas/list.schemas";
import { listCardRoutes } from "./card.routes";

/**
 * Mounted under /api/boards/:boardId/lists by board.routes.ts, after
 * `authenticate` and `validateBoardId` (C26, C55).
 */
export function listRoutes(controller: ListController, cardController: CardController): Router {
  const router = Router({ mergeParams: true });

  router.post("/", validate(parseCreateListInput), controller.create);
  router.patch("/:listId", validate(parseUpdateListInput), controller.update);
  router.delete("/:listId", validateQuery(parseDeleteListQuery), controller.delete);
  router.use("/:listId/cards", listCardRoutes(cardController));

  return router;
}
