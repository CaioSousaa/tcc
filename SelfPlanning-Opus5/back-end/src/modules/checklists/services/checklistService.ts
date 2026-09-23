import { AppError } from "../../../shared/errors/AppError";
import { findOwnedCard } from "../../cards/services/cardService";
import { ChecklistItemView, toChecklistItemView } from "../checklistView";
import { ChecklistItem } from "../entities/ChecklistItem";
import { checklistRepository } from "../repositories/checklistRepository";

export interface ChecklistScope {
  boardId: string;
  userId: string;
  cardId: string;
}

export interface CreateItemRequest extends ChecklistScope {
  title: string;
}

export interface UpdateItemRequest extends ChecklistScope {
  itemId: string;
  title: string;
}

export interface ToggleItemRequest extends ChecklistScope {
  itemId: string;
  done: boolean;
}

async function findOrderedItems(cardId: string): Promise<ChecklistItem[]> {
  return checklistRepository().find({ where: { cardId }, order: { position: "ASC" } });
}

async function viewsOf(cardId: string): Promise<ChecklistItemView[]> {
  const items = await findOrderedItems(cardId);

  return items.map(toChecklistItemView);
}

async function findOwnedItem(
  itemId: string,
  scope: ChecklistScope
): Promise<ChecklistItem> {
  await findOwnedCard(scope.cardId, scope.boardId, scope.userId);

  const item = await checklistRepository().findOne({ where: { id: itemId } });

  if (!item || item.cardId !== scope.cardId) {
    throw new AppError("Item de checklist não encontrado", 404);
  }

  return item;
}

/** Regrava as posições em sequência para que nunca haja buraco na numeração. */
async function persistOrder(items: ChecklistItem[]): Promise<void> {
  const reordered = items.map((item, index) => {
    item.position = index;

    return item;
  });

  await checklistRepository().save(reordered);
}

export async function createItem(data: CreateItemRequest): Promise<ChecklistItemView[]> {
  await findOwnedCard(data.cardId, data.boardId, data.userId);

  const repository = checklistRepository();
  const total = await repository.count({ where: { cardId: data.cardId } });

  const item = repository.create({
    title: data.title,
    done: false,
    position: total,
    cardId: data.cardId,
  });

  await repository.save(item);

  return viewsOf(data.cardId);
}

export async function listItems(scope: ChecklistScope): Promise<ChecklistItemView[]> {
  await findOwnedCard(scope.cardId, scope.boardId, scope.userId);

  return viewsOf(scope.cardId);
}

export async function updateItem(data: UpdateItemRequest): Promise<ChecklistItemView[]> {
  const item = await findOwnedItem(data.itemId, data);

  item.title = data.title;

  await checklistRepository().save(item);

  return viewsOf(data.cardId);
}

export async function toggleItem(data: ToggleItemRequest): Promise<ChecklistItemView[]> {
  const item = await findOwnedItem(data.itemId, data);

  item.done = data.done;

  await checklistRepository().save(item);

  return viewsOf(data.cardId);
}

export async function deleteItem(
  itemId: string,
  scope: ChecklistScope
): Promise<ChecklistItemView[]> {
  const item = await findOwnedItem(itemId, scope);

  await checklistRepository().remove(item);

  await persistOrder(await findOrderedItems(scope.cardId));

  return viewsOf(scope.cardId);
}
