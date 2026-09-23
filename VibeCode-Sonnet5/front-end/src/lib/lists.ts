import { api } from "./api";

export interface BoardList {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchLists(boardId: string): Promise<BoardList[]> {
  const { data } = await api.get<{ lists: BoardList[] }>(
    `/boards/${boardId}/lists`,
  );
  return data.lists;
}

export async function createList(
  boardId: string,
  title: string,
): Promise<BoardList> {
  const { data } = await api.post<{ list: BoardList }>(
    `/boards/${boardId}/lists`,
    { title },
  );
  return data.list;
}

export async function renameList(
  boardId: string,
  listId: string,
  title: string,
): Promise<BoardList> {
  const { data } = await api.patch<{ list: BoardList }>(
    `/boards/${boardId}/lists/${listId}`,
    { title },
  );
  return data.list;
}

export async function reorderLists(
  boardId: string,
  orderedListIds: string[],
): Promise<BoardList[]> {
  const { data } = await api.put<{ lists: BoardList[] }>(
    `/boards/${boardId}/lists/reorder`,
    { orderedListIds },
  );
  return data.lists;
}

export async function deleteList(
  boardId: string,
  listId: string,
  options?: { strategy: "move" | "delete"; targetListId?: string },
): Promise<void> {
  await api.delete(`/boards/${boardId}/lists/${listId}`, { data: options });
}
