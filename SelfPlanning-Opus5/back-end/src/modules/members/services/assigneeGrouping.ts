import { In } from "typeorm";
import { AssigneeView, toAssigneeView } from "../memberView";
import { assigneeRepository } from "../repositories/memberRepository";

export async function assigneesOfCard(cardId: string): Promise<AssigneeView[]> {
  const links = await assigneeRepository().find({
    where: { cardId },
    relations: { member: { user: true } },
    order: { createdAt: "ASC" },
  });

  return links.map((link) => toAssigneeView(link.member));
}

/** Responsáveis de vários cards de uma vez, para a listagem do quadro. */
export async function assigneesByCards(cardIds: string[]): Promise<Map<string, AssigneeView[]>> {
  const grouped = new Map<string, AssigneeView[]>(cardIds.map((cardId) => [cardId, []]));

  if (cardIds.length === 0) {
    return grouped;
  }

  const links = await assigneeRepository().find({
    where: { cardId: In(cardIds) },
    relations: { member: { user: true } },
    order: { createdAt: "ASC" },
  });

  for (const link of links) {
    grouped.get(link.cardId)?.push(toAssigneeView(link.member));
  }

  return grouped;
}
