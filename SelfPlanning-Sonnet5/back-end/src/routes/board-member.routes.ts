import { Router } from "express";
import {
  changeMemberRoleHandler,
  inviteMemberHandler,
  listMembersHandler,
  removeMemberHandler,
} from "../controllers/board-member.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const boardMemberRoutes = Router({ mergeParams: true });

boardMemberRoutes.use(authMiddleware);

boardMemberRoutes.post("/", inviteMemberHandler);
boardMemberRoutes.get("/", listMembersHandler);
boardMemberRoutes.patch("/:memberId", changeMemberRoleHandler);
boardMemberRoutes.delete("/:memberId", removeMemberHandler);
