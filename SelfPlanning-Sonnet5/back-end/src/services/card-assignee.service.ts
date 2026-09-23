import { AppDataSource } from "../config/data-source";
import { CardAssignee } from "../entities/CardAssignee";
import { findBoardById } from "./board.service";
import { getCardInBoard, CardNotFoundError } from "./card.service";
import { requireMember } from "./board-member.service";

const assigneeRepository = () => AppDataSource.getRepository(CardAssignee);

export class AlreadyAssignedError extends Error {}
export class AssigneeNotFoundError extends Error {}

async function ensureCardAccess(requesterId: string, boardId: string, cardId: string) {
  await findBoardById(boardId);
  await requireMember(boardId, requesterId);
  return getCardInBoard(boardId, cardId);
}

export async function listAssignees(
  requesterId: string,
  boardId: string,
  cardId: string
): Promise<CardAssignee[]> {
  await ensureCardAccess(requesterId, boardId, cardId);

  return assigneeRepository().find({
    where: { cardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });
}

export async function addAssignee(
  requesterId: string,
  boardId: string,
  cardId: string,
  userId: string
): Promise<CardAssignee> {
  await ensureCardAccess(requesterId, boardId, cardId);
  await requireMember(boardId, userId);

  const existing = await assigneeRepository().findOne({ where: { cardId, userId } });
  if (existing) {
    throw new AlreadyAssignedError();
  }

  const assignee = assigneeRepository().create({ cardId, userId });
  return assigneeRepository().save(assignee);
}

export async function removeAssignee(
  requesterId: string,
  boardId: string,
  cardId: string,
  userId: string
): Promise<void> {
  await ensureCardAccess(requesterId, boardId, cardId);

  const assignee = await assigneeRepository().findOne({ where: { cardId, userId } });
  if (!assignee) {
    throw new AssigneeNotFoundError();
  }

  await assigneeRepository().remove(assignee);
}

export { CardNotFoundError };
