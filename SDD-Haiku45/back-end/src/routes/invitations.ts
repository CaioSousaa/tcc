import { Router, Request, Response, NextFunction } from "express";
import { MemberService } from "../services/MemberService";
import { requireAuth } from "../middlewares";
import { ValidationError, NotFoundError } from "../types/errors";
import { InvitationRepository } from "../repositories/InvitationRepository";

const router = Router();
const memberService = new MemberService();
const invitationRepository = new InvitationRepository();

router.get(
  "/invitations/:token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = typeof req.params.token === "string" ? req.params.token : "";

      const invitation = await invitationRepository.findByToken(token);

      if (!invitation) {
        next(new NotFoundError("Convite não encontrado"));
        return;
      }

      const now = new Date();
      if (invitation.expires_at < now) {
        next(new ValidationError("Convite expirado"));
        return;
      }

      res.json({
        id: invitation.id,
        board_name: invitation.board.name,
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/invitations/:token/accept",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = typeof req.params.token === "string" ? req.params.token : "";
      const userId = req.userId!;

      const member = await memberService.acceptInvitation(token, userId);

      res.status(201).json({
        id: member.id,
        board_id: member.board_id,
        role: member.role,
        status: member.status,
        created_at: member.created_at,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("expirado")) {
          next(new ValidationError(error.message));
        } else if (error.message.includes("não encontrado")) {
          next(new NotFoundError(error.message));
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }
);

router.post(
  "/invitations/:token/reject",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = typeof req.params.token === "string" ? req.params.token : "";

      const invitation = await invitationRepository.findByToken(token);

      if (!invitation) {
        next(new NotFoundError("Convite não encontrado"));
        return;
      }

      await invitationRepository.delete(invitation.id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
