import { apiClient } from "@/lib/auth/api-client";

export interface List {
  id: string;
  name: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListInput {
  name: string;
}

export interface UpdateListInput {
  name?: string;
  position?: number;
}

export async function listLists(boardId: string): Promise<List[]> {
  const response = await apiClient.get<{ lists: List[] }>(`/boards/${boardId}/lists`);
  return response.data.lists;
}

export async function createList(boardId: string, input: CreateListInput): Promise<List> {
  const response = await apiClient.post<List>(`/boards/${boardId}/lists`, input);
  return response.data;
}

export async function updateList(
  boardId: string,
  listId: string,
  input: UpdateListInput,
): Promise<List> {
  const response = await apiClient.patch<List>(`/boards/${boardId}/lists/${listId}`, input);
  return response.data;
}

export async function deleteList(boardId: string, listId: string): Promise<void> {
  await apiClient.delete(`/boards/${boardId}/lists/${listId}`);
}
