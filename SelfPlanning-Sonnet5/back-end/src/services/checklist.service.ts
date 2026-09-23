import { In } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ChecklistItem } from "../entities/ChecklistItem";
import { getCard } from "./card.service";

const checklistItemRepository = () => AppDataSource.getRepository(ChecklistItem);

export class ChecklistItemNotFoundError extends Error {}

async function ensureCardOwnership(ownerId: string, boardId: string, cardId: string): Promise<void> {
  await getCard(ownerId, boardId, cardId);
}

async function findItemOrThrow(cardId: string, itemId: string): Promise<ChecklistItem> {
  const item = await checklistItemRepository().findOne({ where: { id: itemId, cardId } });
  if (!item) {
    throw new ChecklistItemNotFoundError();
  }
  return item;
}

async function resequence(cardId: string): Promise<void> {
  const items = await checklistItemRepository().find({
    where: { cardId },
    order: { position: "ASC" },
  });
  items.forEach((item, index) => {
    item.position = index;
  });
  if (items.length) {
    await checklistItemRepository().save(items);
  }
}

export async function createChecklistItem(
  ownerId: string,
  boardId: string,
  cardId: string,
  text: string
): Promise<ChecklistItem> {
  await ensureCardOwnership(ownerId, boardId, cardId);

  const count = await checklistItemRepository().count({ where: { cardId } });
  const item = checklistItemRepository().create({ cardId, text, position: count });
  return checklistItemRepository().save(item);
}

export async function listChecklistItems(
  ownerId: string,
  boardId: string,
  cardId: string
): Promise<ChecklistItem[]> {
  await ensureCardOwnership(ownerId, boardId, cardId);

  return checklistItemRepository().find({
    where: { cardId },
    order: { position: "ASC" },
  });
}

export async function updateChecklistItem(
  ownerId: string,
  boardId: string,
  cardId: string,
  itemId: string,
  changes: { text?: string; done?: boolean }
): Promise<ChecklistItem> {
  await ensureCardOwnership(ownerId, boardId, cardId);
  const item = await findItemOrThrow(cardId, itemId);

  if (changes.text !== undefined) item.text = changes.text;
  if (changes.done !== undefined) item.done = changes.done;

  return checklistItemRepository().save(item);
}

export interface ChecklistProgress {
  done: number;
  total: number;
}

export async function getChecklistProgressForCards(
  cardIds: string[]
): Promise<Record<string, ChecklistProgress>> {
  if (cardIds.length === 0) return {};

  const items = await checklistItemRepository().find({ where: { cardId: In(cardIds) } });

  const result: Record<string, ChecklistProgress> = {};
  for (const cardId of cardIds) {
    result[cardId] = { done: 0, total: 0 };
  }
  for (const item of items) {
    const progress = result[item.cardId];
    if (!progress) continue;
    progress.total += 1;
    if (item.done) progress.done += 1;
  }
  return result;
}

export async function deleteChecklistItem(
  ownerId: string,
  boardId: string,
  cardId: string,
  itemId: string
): Promise<void> {
  await ensureCardOwnership(ownerId, boardId, cardId);
  const item = await findItemOrThrow(cardId, itemId);
  await checklistItemRepository().remove(item);
  await resequence(cardId);
}
