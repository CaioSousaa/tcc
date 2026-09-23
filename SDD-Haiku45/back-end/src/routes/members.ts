import { Router, Request, Response, NextFunction } from "express";
import { MemberService } from "../services/MemberService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError, ForbiddenError } from "../types/errors";

const router = Router();
const memberService = new MemberService();

router.post(
  "/boards/:boardId/members/invite",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const { email, role } = req.body;
      const userId = req.userId!;

      if (!email) {
        next(new ValidationError("Email é obrigatório"));
        return;
      }

      if (!role) {
        next(new ValidationError("Papel é obrigatório"));
        return;
      }

      const invitation = await memberService.inviteMember(
        boardId,
        email,
        role,
        userId
      );

      res.status(201).json({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: "pending",
        created_at: invitation.created_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes("Email") ||
          error.message.includes("Papel")
        ) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("administrador")) {
          next(new ForbiddenError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.get(
  "/boards/:boardId/members",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const userId = req.userId!;

      const { members, invitations } = await memberService.getMembersOfBoard(
        boardId,
        userId
      );

      res.json({
        members: members.map((m) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.user?.email || "Convite pendente",
          role: m.role,
          status: m.status,
          created_at: m.created_at,
        })),
        invitations: invitations.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          status: "pending",
          created_at: i.created_at,
          expires_at: i.expires_at,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  "/boards/:boardId/members/:memberId/role",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const memberId = typeof req.params.memberId === "string" ? req.params.memberId : "";
      const { role } = req.body;
      const userId = req.userId!;

      if (!role) {
        next(new ValidationError("Papel é obrigatório"));
        return;
      }

      await memberService.changeMemberRole(boardId, memberId, role, userId);

      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("administrador")) {
          next(new ForbiddenError(error.message));
        } else if (error.message.includes("Papel inválido")) {
          next(new ValidationError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.delete(
  "/boards/:boardId/members/:memberId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const boardId = typeof req.params.boardId === "string" ? req.params.boardId : "";
      const memberId = typeof req.params.memberId === "string" ? req.params.memberId : "";
      const userId = req.userId!;

      await memberService.removeMember(boardId, memberId, userId);

      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("administrador")) {
          next(new ForbiddenError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

export default router;
