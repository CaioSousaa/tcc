import { In } from "typeorm";
import { LabelView, toLabelView } from "../labelView";
import { cardLabelRepository } from "../repositories/labelRepository";

export async function labelsOfCard(cardId: string): Promise<LabelView[]> {
  const links = await cardLabelRepository().find({
    where: { cardId },
    relations: { label: true },
    order: { createdAt: "ASC" },
  });

  return links.map((link) => toLabelView(link.label));
}

/** Etiquetas de vários cards de uma vez, para a listagem do quadro. */
export async function labelsByCards(cardIds: string[]): Promise<Map<string, LabelView[]>> {
  const grouped = new Map<string, LabelView[]>(cardIds.map((cardId) => [cardId, []]));

  if (cardIds.length === 0) {
    return grouped;
  }

  const links = await cardLabelRepository().find({
    where: { cardId: In(cardIds) },
    relations: { label: true },
    order: { createdAt: "ASC" },
  });

  for (const link of links) {
    grouped.get(link.cardId)?.push(toLabelView(link.label));
  }

  return grouped;
}
