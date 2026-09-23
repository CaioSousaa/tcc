import { AppError } from "../../../shared/errors/AppError";
import { findOwnedCard } from "../../cards/services/cardService";
import { AssigneeView } from "../memberView";
import { assigneeRepository, memberRepository } from "../repositories/memberRepository";
import { assigneesOfCard } from "./assigneeGrouping";

export interface AssigneeRequest {
  boardId: string;
  userId: string;
  cardId: string;
  memberId: string;
}

export async function assignMember(data: AssigneeRequest): Promise<AssigneeView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const member = await memberRepository().findOne({ where: { id: data.memberId } });

  if (!member || member.boardId !== data.boardId) {
    throw new AppError("Apenas membros do quadro podem ser responsáveis por um card", 404);
  }

  const repository = assigneeRepository();

  const alreadyAssigned = await repository.findOne({
    where: { cardId: data.cardId, memberId: member.id },
  });

  if (!alreadyAssigned) {
    await repository.save(repository.create({ cardId: data.cardId, memberId: member.id }));
  }

  return assigneesOfCard(data.cardId);
}

export async function unassignMember(data: AssigneeRequest): Promise<AssigneeView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const repository = assigneeRepository();

  const link = await repository.findOne({
    where: { cardId: data.cardId, memberId: data.memberId },
  });

  if (link) {
    await repository.remove(link);
  }

  return assigneesOfCard(data.cardId);
}

export async function listAssignees(data: Omit<AssigneeRequest, "memberId">): Promise<AssigneeView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  return assigneesOfCard(data.cardId);
}
