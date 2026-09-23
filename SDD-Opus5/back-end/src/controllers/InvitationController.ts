import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { TodayQuery } from "../schemas/board.schemas";
import type { InvitationAccount, InvitationService } from "../services/InvitationService";

/** Identity and e-mail come only from the session (RF07 RN08). */
function currentAccount(req: Request): InvitationAccount {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return { id: req.user.id, email: req.user.email };
}

function invitationIdParam(req: Request): string {
  return String(req.params.invitationId);
}

export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const invitations = await this.invitationService.list(currentAccount(req));
    res.status(200).json({ invitations });
  };

  accept = async (req: Request, res: Response): Promise<void> => {
    const { today } = (res.locals.query ?? { today: null }) as TodayQuery;
    const board = await this.invitationService.accept(currentAccount(req), invitationIdParam(req), today);
    res.status(200).json({ board });
  };

  decline = async (req: Request, res: Response): Promise<void> => {
    await this.invitationService.decline(currentAccount(req), invitationIdParam(req));
    res.status(204).end();
  };
}
