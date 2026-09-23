import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { assignMember, listAssignees, unassignMember } from "../services/assigneeService";

function scopeFrom(request: Request): { boardId: string; cardId: string; userId: string } {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return {
    boardId: requireUuid(request.params.boardId, "boardId"),
    cardId: requireUuid(request.params.cardId, "cardId"),
    userId: authenticated.id,
  };
}

export async function index(request: Request, response: Response): Promise<void> {
  const assignees = await listAssignees(scopeFrom(request));

  response.status(200).json({ assignees });
}

export async function assign(request: Request, response: Response): Promise<void> {
  const assignees = await assignMember({
    ...scopeFrom(request),
    memberId: requireUuid(request.body?.memberId, "memberId"),
  });

  response.status(201).json({ assignees });
}

export async function unassign(request: Request, response: Response): Promise<void> {
  const assignees = await unassignMember({
    ...scopeFrom(request),
    memberId: requireUuid(request.params.memberId, "memberId"),
  });

  response.status(200).json({ assignees });
}
