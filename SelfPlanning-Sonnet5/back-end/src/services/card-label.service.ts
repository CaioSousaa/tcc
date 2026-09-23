import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { CardLabel } from "../entities/CardLabel";
import { Label } from "../entities/Label";
import { getCard } from "./card.service";
import { getLabelInBoard } from "./label.service";

const cardLabelRepository = () => AppDataSource.getRepository(CardLabel);

export class AlreadyLabeledError extends Error {}
export class CardLabelNotFoundError extends Error {}

async function ensureCardOwnership(ownerId: string, boardId: string, cardId: string) {
  return getCard(ownerId, boardId, cardId);
}

export async function listCardLabels(
  ownerId: string,
  boardId: string,
  cardId: string
): Promise<Label[]> {
  await ensureCardOwnership(ownerId, boardId, cardId);

  const rows = await cardLabelRepository().find({
    where: { cardId },
    relations: { label: true },
    order: { createdAt: "ASC" },
  });

  return rows.map((row) => row.label);
}

export async function addLabelToCard(
  ownerId: string,
  boardId: string,
  cardId: string,
  labelId: string
): Promise<Label[]> {
  await ensureCardOwnership(ownerId, boardId, cardId);
  await getLabelInBoard(boardId, labelId);

  const existing = await cardLabelRepository().findOne({ where: { cardId, labelId } });
  if (!existing) {
    const cardLabel = cardLabelRepository().create({ cardId, labelId });
    await cardLabelRepository().save(cardLabel);
  }

  return listCardLabels(ownerId, boardId, cardId);
}

export async function removeLabelFromCard(
  ownerId: string,
  boardId: string,
  cardId: string,
  labelId: string
): Promise<void> {
  await ensureCardOwnership(ownerId, boardId, cardId);

  const cardLabel = await cardLabelRepository().findOne({ where: { cardId, labelId } });
  if (!cardLabel) {
    throw new CardLabelNotFoundError();
  }
  await cardLabelRepository().remove(cardLabel);
}

export async function getLabelsForCards(cardIds: string[]): Promise<Record<string, Label[]>> {
  if (cardIds.length === 0) return {};

  const rows = await cardLabelRepository().find({
    where: { cardId: In(cardIds) },
    relations: { label: true },
    order: { createdAt: "ASC" },
  });

  const result: Record<string, Label[]> = {};
  for (const cardId of cardIds) {
    result[cardId] = [];
  }
  for (const row of rows) {
    result[row.cardId]?.push(row.label);
  }
  return result;
}

export async function getCardIdsWithAnyLabel(labelIds: string[]): Promise<Set<string>> {
  if (labelIds.length === 0) return new Set();

  const rows = await cardLabelRepository().find({ where: { labelId: In(labelIds) } });
  return new Set(rows.map((row) => row.cardId));
}
