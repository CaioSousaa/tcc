import { apiClient } from "@/lib/auth/api-client";

export interface CardProgress {
  completed: number;
  total: number;
  percentage: number;
}

export interface CardAssignee {
  userId: string;
  name: string;
  email: string;
}

export interface CardLabel {
  id: string;
  name: string;
  color: string;
}

export type DueDateStatus = "overdue" | "due_soon" | null;

export interface Card {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: number;
  dueDate: string | null;
  dueDateStatus: DueDateStatus;
  progress: CardProgress | null;
  assignees: CardAssignee[];
  labels: CardLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateCardInput {
  title?: string;
  description?: string | null;
  targetListId?: string;
  dueDate?: string | null;
}

export async function listCards(
  boardId: string,
  listId: string,
  labelIds?: string[],
  sortByDueDate?: boolean,
): Promise<Card[]> {
  const params: Record<string, string> = {};
  if (labelIds && labelIds.length > 0) {
    params.labelIds = labelIds.join(",");
  }
  if (sortByDueDate) {
    params.sortByDueDate = "true";
  }
  const response = await apiClient.get<{ cards: Card[] }>(
    `/boards/${boardId}/lists/${listId}/cards`,
    Object.keys(params).length > 0 ? { params } : undefined,
  );
  return response.data.cards;
}

export async function createCard(
  boardId: string,
  listId: string,
  input: CreateCardInput,
): Promise<Card> {
  const response = await apiClient.post<Card>(`/boards/${boardId}/lists/${listId}/cards`, input);
  return response.data;
}

export async function updateCard(
  boardId: string,
  listId: string,
  cardId: string,
  input: UpdateCardInput,
): Promise<Card> {
  const response = await apiClient.patch<Card>(
    `/boards/${boardId}/lists/${listId}/cards/${cardId}`,
    input,
  );
  return response.data;
}

export async function deleteCard(boardId: string, listId: string, cardId: string): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}`);
}

export async function assignCard(
  boardId: string,
  listId: string,
  cardId: string,
  userId: string,
): Promise<void> {
  await apiClient.post(`/boards/${boardId}/lists/${listId}/cards/${cardId}/assignees`, { userId });
}

export async function unassignCard(
  boardId: string,
  listId: string,
  cardId: string,
  userId: string,
): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}/assignees/${userId}`);
}

export async function attachLabel(
  boardId: string,
  listId: string,
  cardId: string,
  labelId: string,
): Promise<void> {
  await apiClient.post(`/boards/${boardId}/lists/${listId}/cards/${cardId}/labels`, { labelId });
}

export async function detachLabel(
  boardId: string,
  listId: string,
  cardId: string,
  labelId: string,
): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/lists/${listId}/cards/${cardId}/labels/${labelId}`);
}
