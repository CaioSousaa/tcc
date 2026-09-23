import { api } from "./api";

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position: number;
  cardId: string;
}

function checklistUrl(boardId: string, cardId: string): string {
  return `/boards/${boardId}/cards/${cardId}/checklist`;
}

export async function listChecklistRequest(
  boardId: string,
  cardId: string
): Promise<ChecklistItem[]> {
  const response = await api.get<{ items: ChecklistItem[] }>(checklistUrl(boardId, cardId));

  return response.data.items;
}

export async function createChecklistItemRequest(
  boardId: string,
  cardId: string,
  title: string
): Promise<ChecklistItem[]> {
  const response = await api.post<{ items: ChecklistItem[] }>(checklistUrl(boardId, cardId), {
    title,
  });

  return response.data.items;
}

export async function updateChecklistItemRequest(
  boardId: string,
  cardId: string,
  itemId: string,
  title: string
): Promise<ChecklistItem[]> {
  const response = await api.put<{ items: ChecklistItem[] }>(
    `${checklistUrl(boardId, cardId)}/${itemId}`,
    { title }
  );

  return response.data.items;
}

export async function toggleChecklistItemRequest(
  boardId: string,
  cardId: string,
  itemId: string,
  done: boolean
): Promise<ChecklistItem[]> {
  const response = await api.patch<{ items: ChecklistItem[] }>(
    `${checklistUrl(boardId, cardId)}/${itemId}/done`,
    { done }
  );

  return response.data.items;
}

export async function deleteChecklistItemRequest(
  boardId: string,
  cardId: string,
  itemId: string
): Promise<ChecklistItem[]> {
  const response = await api.delete<{ items: ChecklistItem[] }>(
    `${checklistUrl(boardId, cardId)}/${itemId}`
  );

  return response.data.items;
}
