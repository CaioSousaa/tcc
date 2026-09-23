import { api } from "./api";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  position: number;
  cardId: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchChecklistItems(
  boardId: string,
  cardId: string,
): Promise<ChecklistItem[]> {
  const { data } = await api.get<{ items: ChecklistItem[] }>(
    `/boards/${boardId}/cards/${cardId}/checklist-items`,
  );
  return data.items;
}

export async function createChecklistItem(
  boardId: string,
  cardId: string,
  text: string,
): Promise<ChecklistItem> {
  const { data } = await api.post<{ item: ChecklistItem }>(
    `/boards/${boardId}/cards/${cardId}/checklist-items`,
    { text },
  );
  return data.item;
}

export async function updateChecklistItem(
  boardId: string,
  cardId: string,
  itemId: string,
  input: { text?: string; completed?: boolean },
): Promise<ChecklistItem> {
  const { data } = await api.patch<{ item: ChecklistItem }>(
    `/boards/${boardId}/cards/${cardId}/checklist-items/${itemId}`,
    input,
  );
  return data.item;
}

export async function deleteChecklistItem(
  boardId: string,
  cardId: string,
  itemId: string,
): Promise<void> {
  await api.delete(
    `/boards/${boardId}/cards/${cardId}/checklist-items/${itemId}`,
  );
}
