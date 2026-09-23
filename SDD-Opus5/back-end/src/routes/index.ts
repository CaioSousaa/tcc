import { Router } from "express";
import type { AssigneeController } from "../controllers/AssigneeController";
import type { AuthController } from "../controllers/AuthController";
import type { BoardController } from "../controllers/BoardController";
import type { CardController } from "../controllers/CardController";
import type { CardLabelController } from "../controllers/CardLabelController";
import type { CommentController } from "../controllers/CommentController";
import type { ChecklistController } from "../controllers/ChecklistController";
import type { InvitationController } from "../controllers/InvitationController";
import type { LabelController } from "../controllers/LabelController";
import type { ListController } from "../controllers/ListController";
import type { MemberController } from "../controllers/MemberController";
import type { AuthService } from "../services/AuthService";
import { authRoutes } from "./auth.routes";
import { boardRoutes } from "./board.routes";
import { invitationRoutes } from "./invitation.routes";

export type ApiDependencies = {
  authController: AuthController;
  authService: AuthService;
  boardController: BoardController;
  listController: ListController;
  cardController: CardController;
  checklistController: ChecklistController;
  memberController: MemberController;
  invitationController: InvitationController;
  assigneeController: AssigneeController;
  labelController: LabelController;
  cardLabelController: CardLabelController;
  commentController: CommentController;
};

export function apiRoutes(deps: ApiDependencies): Router {
  const router = Router();
  router.use("/auth", authRoutes(deps.authController, deps.authService));
  router.use(
    "/boards",
    boardRoutes(
      {
        board: deps.boardController,
        list: deps.listController,
        card: deps.cardController,
        checklist: deps.checklistController,
        member: deps.memberController,
        assignee: deps.assigneeController,
        label: deps.labelController,
        cardLabel: deps.cardLabelController,
        comment: deps.commentController,
      },
      deps.authService,
    ),
  );
  router.use("/invitations", invitationRoutes(deps.invitationController, deps.authService));
  return router;
}
