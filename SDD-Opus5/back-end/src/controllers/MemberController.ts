import type { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import type { InviteInput, RoleInput } from "../schemas/member.schemas";
import type { MemberService } from "../services/MemberService";

function currentUserId(req: Request): string {
  if (!req.user) throw new AppError("UNAUTHENTICATED");
  return req.user.id;
}

function param(req: Request, name: "boardId" | "userId" | "invitationId"): string {
  return String(req.params[name]);
}

export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  get = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json(await this.memberService.get(currentUserId(req), param(req, "boardId")));
  };

  invite = async (req: Request, res: Response): Promise<void> => {
    const state = await this.memberService.invite(currentUserId(req), param(req, "boardId"), req.body as InviteInput);
    res.status(201).json(state);
  };

  updateInvitation = async (req: Request, res: Response): Promise<void> => {
    const state = await this.memberService.updateInvitation(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "invitationId"),
      req.body as RoleInput,
    );
    res.status(200).json(state);
  };

  cancelInvitation = async (req: Request, res: Response): Promise<void> => {
    const state = await this.memberService.cancelInvitation(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "invitationId"),
    );
    res.status(200).json(state);
  };

  updateMember = async (req: Request, res: Response): Promise<void> => {
    const state = await this.memberService.updateMember(
      currentUserId(req),
      param(req, "boardId"),
      param(req, "userId"),
      req.body as RoleInput,
    );
    res.status(200).json(state);
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    const result = await this.memberService.removeMember(currentUserId(req), param(req, "boardId"), param(req, "userId"));
    res.status(200).json(result);
  };
}
