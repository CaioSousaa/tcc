import { Router } from "express";
import {
  inviteMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "../controllers/board-member.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const boardMemberRouter = Router({ mergeParams: true });

boardMemberRouter.use(requireAuth);

boardMemberRouter.get("/", listMembers);
boardMemberRouter.post("/", inviteMember);
boardMemberRouter.patch("/:userId", updateMemberRole);
boardMemberRouter.delete("/:userId", removeMember);
