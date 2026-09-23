import { api } from "@/lib/api";

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position: number;
  cardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistItemInput {
  cardId: string;
  title: string;
  position?: number;
}

export interface UpdateChecklistItemInput {
  title?: string;
  done?: boolean;
  position?: number;
}

export async function listChecklistItems(
  boardId: string,
): Promise<ChecklistItem[]> {
  const response = await api.get<{ items: ChecklistItem[] }>(
    `/boards/${boardId}/checklist-items`,
  );

  return response.data.items;
}

export async function createChecklistItem(
  boardId: string,
  input: CreateChecklistItemInput,
): Promise<ChecklistItem> {
  const response = await api.post<{ item: ChecklistItem }>(
    `/boards/${boardId}/checklist-items`,
    input,
  );

  return response.data.item;
}

export async function updateChecklistItem(
  boardId: string,
  itemId: string,
  input: UpdateChecklistItemInput,
): Promise<ChecklistItem> {
  const response = await api.patch<{ item: ChecklistItem }>(
    `/boards/${boardId}/checklist-items/${itemId}`,
    input,
  );

  return response.data.item;
}

export async function deleteChecklistItem(
  boardId: string,
  itemId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/checklist-items/${itemId}`);
}
