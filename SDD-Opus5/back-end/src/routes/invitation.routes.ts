import { Router } from "express";
import type { InvitationController } from "../controllers/InvitationController";
import { authenticate } from "../middlewares/authenticate";
import { validateQuery } from "../middlewares/validate";
import { parseTodayQuery } from "../schemas/board.schemas";
import type { AuthService } from "../services/AuthService";

/** /api/invitations: invitations of the session account (RF07 plan 4.5). */
export function invitationRoutes(controller: InvitationController, authService: AuthService): Router {
  const router = Router();
  router.use(authenticate(authService));
  router.get("/", controller.list);
  router.post("/:invitationId/accept", validateQuery(parseTodayQuery), controller.accept);
  router.post("/:invitationId/decline", controller.decline);
  return router;
}
