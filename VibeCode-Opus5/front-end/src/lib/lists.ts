import { api } from "@/lib/api";

export interface BoardList {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListInput {
  title: string;
  position?: number;
}

export interface UpdateListInput {
  title?: string;
  position?: number;
}

export async function listLists(boardId: string): Promise<BoardList[]> {
  const response = await api.get<{ lists: BoardList[] }>(
    `/boards/${boardId}/lists`,
  );

  return response.data.lists;
}

export async function createList(
  boardId: string,
  input: CreateListInput,
): Promise<BoardList> {
  const response = await api.post<{ list: BoardList }>(
    `/boards/${boardId}/lists`,
    input,
  );

  return response.data.list;
}

export async function updateList(
  boardId: string,
  listId: string,
  input: UpdateListInput,
): Promise<BoardList> {
  const response = await api.patch<{ list: BoardList }>(
    `/boards/${boardId}/lists/${listId}`,
    input,
  );

  return response.data.list;
}

export async function reorderLists(
  boardId: string,
  listIds: string[],
): Promise<BoardList[]> {
  const response = await api.patch<{ lists: BoardList[] }>(
    `/boards/${boardId}/lists/reorder`,
    { listIds },
  );

  return response.data.lists;
}

export type DeleteListInput =
  | { mode: "delete" }
  | { mode: "move"; targetListId: string };

export async function deleteList(
  boardId: string,
  listId: string,
  input: DeleteListInput,
): Promise<void> {
  await api.delete(`/boards/${boardId}/lists/${listId}`, { data: input });
}
