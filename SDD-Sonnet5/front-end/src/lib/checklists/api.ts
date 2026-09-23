import { apiClient } from "@/lib/auth/api-client";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  checklistId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  name: string;
  cardId: string;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

function base(boardId: string, listId: string, cardId: string) {
  return `/boards/${boardId}/lists/${listId}/cards/${cardId}/checklists`;
}

export async function listChecklists(
  boardId: string,
  listId: string,
  cardId: string,
): Promise<Checklist[]> {
  const response = await apiClient.get<{ checklists: Checklist[] }>(base(boardId, listId, cardId));
  return response.data.checklists;
}

export async function createChecklist(
  boardId: string,
  listId: string,
  cardId: string,
  name: string,
): Promise<Checklist> {
  const response = await apiClient.post<Checklist>(base(boardId, listId, cardId), { name });
  return response.data;
}

export async function deleteChecklist(
  boardId: string,
  listId: string,
  cardId: string,
  checklistId: string,
): Promise<void> {
  await apiClient.delete(`${base(boardId, listId, cardId)}/${checklistId}`);
}

export async function createChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  checklistId: string,
  text: string,
): Promise<ChecklistItem> {
  const response = await apiClient.post<ChecklistItem>(
    `${base(boardId, listId, cardId)}/${checklistId}/items`,
    { text },
  );
  return response.data;
}

export async function updateChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
  completed: boolean,
): Promise<ChecklistItem> {
  const response = await apiClient.patch<ChecklistItem>(
    `${base(boardId, listId, cardId)}/${checklistId}/items/${itemId}`,
    { completed },
  );
  return response.data;
}

export async function deleteChecklistItem(
  boardId: string,
  listId: string,
  cardId: string,
  checklistId: string,
  itemId: string,
): Promise<void> {
  await apiClient.delete(`${base(boardId, listId, cardId)}/${checklistId}/items/${itemId}`);
}
