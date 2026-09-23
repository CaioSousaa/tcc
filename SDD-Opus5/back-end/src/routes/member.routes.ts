import { Router } from "express";
import type { MemberController } from "../controllers/MemberController";
import { validate } from "../middlewares/validate";
import { parseInviteInput, parseRoleInput } from "../schemas/member.schemas";

/** Mounted under /api/boards/:boardId/members, after authenticate and validateBoardId (RF07 plan 4.2, 4.4). */
export function memberRoutes(controller: MemberController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", controller.get);
  router.patch("/:userId", validate(parseRoleInput), controller.updateMember);
  router.delete("/:userId", controller.removeMember);
  return router;
}

/** Mounted under /api/boards/:boardId/invitations, after authenticate and validateBoardId (RF07 plan 4.3). */
export function boardInvitationRoutes(controller: MemberController): Router {
  const router = Router({ mergeParams: true });
  router.post("/", validate(parseInviteInput), controller.invite);
  router.patch("/:invitationId", validate(parseRoleInput), controller.updateInvitation);
  router.delete("/:invitationId", controller.cancelInvitation);
  return router;
}
