import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { NotBoardMemberError } from "../services/board-member.service";
import {
  AlreadyAssignedError,
  AssigneeNotFoundError,
  CardNotFoundError,
  addAssignee,
  listAssignees,
  removeAssignee,
} from "../services/card-assignee.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof NotBoardMemberError) {
    res.status(403).json({ message: "Você não é membro deste quadro" });
    return true;
  }
  if (error instanceof CardNotFoundError) {
    res.status(404).json({ message: "Card não encontrado" });
    return true;
  }
  if (error instanceof AlreadyAssignedError) {
    res.status(409).json({ message: "Usuário já é responsável por este card" });
    return true;
  }
  if (error instanceof AssigneeNotFoundError) {
    res.status(404).json({ message: "Responsável não encontrado neste card" });
    return true;
  }
  return false;
}

function toAssigneeResponse(assignee: {
  userId: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
}) {
  return {
    userId: assignee.userId,
    createdAt: assignee.createdAt,
    user: { id: assignee.user.id, name: assignee.user.name, email: assignee.user.email },
  };
}

export async function listAssigneesHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const assignees = await listAssignees(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(200).json(assignees.map(toAssigneeResponse));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function addAssigneeHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { userId } = req.body ?? {};

  if (typeof userId !== "string" || !userId) {
    res.status(400).json({ message: "userId é obrigatório" });
    return;
  }

  try {
    await addAssignee(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      userId
    );
    const assignees = await listAssignees(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(201).json(assignees.map(toAssigneeResponse));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function removeAssigneeHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await removeAssignee(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      req.params.userId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
