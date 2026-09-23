import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { BOARD_ROLES, BoardRole } from "../entities/BoardMember";
import {
  AlreadyMemberError,
  BoardMemberNotFoundError,
  ForbiddenRoleError,
  InviteeNotFoundError,
  LastAdminError,
  NotBoardMemberError,
  changeMemberRole,
  getMemberWithUser,
  inviteMember,
  listMembers,
  removeMember,
} from "../services/board-member.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function isValidRole(role: unknown): role is BoardRole {
  return typeof role === "string" && (BOARD_ROLES as readonly string[]).includes(role);
}

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof NotBoardMemberError) {
    res.status(403).json({ message: "Você não é membro deste quadro" });
    return true;
  }
  if (error instanceof ForbiddenRoleError) {
    res.status(403).json({ message: "Apenas administradores podem realizar esta ação" });
    return true;
  }
  if (error instanceof InviteeNotFoundError) {
    res.status(404).json({ message: "Nenhum usuário cadastrado com esse e-mail" });
    return true;
  }
  if (error instanceof AlreadyMemberError) {
    res.status(409).json({ message: "Usuário já é membro deste quadro" });
    return true;
  }
  if (error instanceof BoardMemberNotFoundError) {
    res.status(404).json({ message: "Membro não encontrado" });
    return true;
  }
  if (error instanceof LastAdminError) {
    res.status(409).json({ message: "O quadro precisa de ao menos um administrador" });
    return true;
  }
  return false;
}

function toMemberResponse(member: {
  id: string;
  role: BoardRole;
  createdAt: Date;
  user: { id: string; name: string; email: string };
}) {
  return {
    id: member.id,
    role: member.role,
    createdAt: member.createdAt,
    user: { id: member.user.id, name: member.user.name, email: member.user.email },
  };
}

export async function inviteMemberHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { email, role } = req.body ?? {};

  if (typeof email !== "string" || !email.trim()) {
    res.status(400).json({ message: "E-mail é obrigatório" });
    return;
  }
  if (role !== undefined && !isValidRole(role)) {
    res.status(400).json({ message: `role deve ser uma de: ${BOARD_ROLES.join(", ")}` });
    return;
  }

  try {
    const member = await inviteMember(
      req.userId as string,
      req.params.boardId as string,
      email.toLowerCase().trim(),
      role ?? "member"
    );
    const withUser = await getMemberWithUser(req.params.boardId as string, member.id);
    res.status(201).json(toMemberResponse(withUser));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listMembersHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const members = await listMembers(req.userId as string, req.params.boardId as string);
    res.status(200).json(members.map(toMemberResponse));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function changeMemberRoleHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { role } = req.body ?? {};

  if (!isValidRole(role)) {
    res.status(400).json({ message: `role deve ser uma de: ${BOARD_ROLES.join(", ")}` });
    return;
  }

  try {
    await changeMemberRole(
      req.userId as string,
      req.params.boardId as string,
      req.params.memberId as string,
      role
    );
    const withUser = await getMemberWithUser(
      req.params.boardId as string,
      req.params.memberId as string
    );
    res.status(200).json(toMemberResponse(withUser));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function removeMemberHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await removeMember(
      req.userId as string,
      req.params.boardId as string,
      req.params.memberId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
