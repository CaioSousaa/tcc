import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireEmail, requireUuid } from "../../../shared/validation/validators";
import { requireMemberRole } from "../memberValidation";
import {
  inviteMember,
  listMembers,
  removeMember,
  updateMemberRole,
} from "../services/memberService";

function authenticatedUserId(request: Request): string {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return authenticated.id;
}

function boardIdFrom(request: Request): string {
  return requireUuid(request.params.boardId, "boardId");
}

export async function invite(request: Request, response: Response): Promise<void> {
  const members = await inviteMember({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    email: requireEmail(request.body?.email),
    role: requireMemberRole(request.body?.role),
  });

  response.status(201).json({ members });
}

export async function index(request: Request, response: Response): Promise<void> {
  const members = await listMembers(boardIdFrom(request), authenticatedUserId(request));

  response.status(200).json({ members });
}

export async function updateRole(request: Request, response: Response): Promise<void> {
  const members = await updateMemberRole({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    memberId: requireUuid(request.params.memberId, "memberId"),
    role: requireMemberRole(request.body?.role),
  });

  response.status(200).json({ members });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const members = await removeMember({
    boardId: boardIdFrom(request),
    actorId: authenticatedUserId(request),
    memberId: requireUuid(request.params.memberId, "memberId"),
  });

  response.status(200).json({ members });
}
