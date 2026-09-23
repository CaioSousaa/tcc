import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { BoardsMembersService, InvitedMember } from "./boards-members.service";
import {
  formatZodError,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from "./boards-members.schemas";
import { BoardMember } from "./entities/board-member.entity";
import { MemberInfo } from "./repositories/board-member.repository.types";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function requireUserId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

function serializeInvited(member: InvitedMember) {
  return member;
}

function serializeMemberInfo(member: MemberInfo) {
  return {
    userId: member.userId,
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

function serializeMembership(boardId: string, membership: BoardMember) {
  return { userId: membership.userId, role: membership.role, boardId };
}

export function buildBoardsMembersController(service: BoardsMembersService) {
  const invite = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const member = await service.invite(actorId, boardId, parsed.data);
    res.status(201).json(serializeInvited(member));
  });

  const list = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const members = await service.list(actorId, boardId);
    res.status(200).json({ members: members.map(serializeMemberInfo) });
  });

  const updateRole = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const memberId = req.params["memberId"] as string;
    const parsed = updateMemberRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const updated = await service.updateRole(actorId, boardId, memberId, parsed.data);
    res.status(200).json(serializeMembership(boardId, updated));
  });

  const remove = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    const memberId = req.params["memberId"] as string;
    await service.remove(actorId, boardId, memberId);
    res.status(204).send();
  });

  const leave = asyncHandler(async (req, res) => {
    const actorId = requireUserId(req);
    const boardId = req.params["boardId"] as string;
    await service.leave(actorId, boardId);
    res.status(204).send();
  });

  return { invite, list, updateRole, remove, leave };
}
