import { Router } from "express";
import type { AssigneeController } from "../controllers/AssigneeController";
import type { BoardController } from "../controllers/BoardController";
import type { CardController } from "../controllers/CardController";
import type { CardLabelController } from "../controllers/CardLabelController";
import type { CommentController } from "../controllers/CommentController";
import type { ChecklistController } from "../controllers/ChecklistController";
import type { LabelController } from "../controllers/LabelController";
import type { ListController } from "../controllers/ListController";
import type { MemberController } from "../controllers/MemberController";
import { authenticate } from "../middlewares/authenticate";
import { validate, validateQuery } from "../middlewares/validate";
import { validateBoardId } from "../middlewares/validateBoardId";
import { parseCreateBoardInput, parseTodayQuery, parseUpdateBoardInput } from "../schemas/board.schemas";
import type { AuthService } from "../services/AuthService";
import { cardRoutes } from "./card.routes";
import { labelRoutes } from "./label.routes";
import { listRoutes } from "./list.routes";
import { boardInvitationRoutes, memberRoutes } from "./member.routes";

export type BoardRouteControllers = {
  board: BoardController;
  list: ListController;
  card: CardController;
  checklist: ChecklistController;
  member: MemberController;
  assignee: AssigneeController;
  label: LabelController;
  cardLabel: CardLabelController;
  comment: CommentController;
};

export function boardRoutes(controllers: BoardRouteControllers, authService: AuthService): Router {
  const controller = controllers.board;
  const router = Router();

  // Every board route requires a valid session (C26).
  router.use(authenticate(authService));

  router.get("/", validateQuery(parseTodayQuery), controller.list);
  router.post("/", validate(parseCreateBoardInput), controller.create);
  router.get("/:boardId", validateBoardId, controller.get);
  router.put("/:boardId", validateBoardId, validate(parseUpdateBoardInput), controller.update);
  router.delete("/:boardId", validateBoardId, controller.delete);

  router.use("/:boardId/lists", validateBoardId, listRoutes(controllers.list, controllers.card));
  router.use(
    "/:boardId/cards",
    validateBoardId,
    cardRoutes(controllers.card, controllers.checklist, controllers.assignee, controllers.cardLabel, controllers.comment),
  );
  router.use("/:boardId/members", validateBoardId, memberRoutes(controllers.member));
  router.use("/:boardId/invitations", validateBoardId, boardInvitationRoutes(controllers.member));
  router.use("/:boardId/labels", validateBoardId, labelRoutes(controllers.label));

  return router;
}
