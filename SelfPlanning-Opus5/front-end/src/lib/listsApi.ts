import { api } from "./api";
import { CardsByList } from "./cardsApi";

export interface BoardList {
  id: string;
  name: string;
  position: number;
  boardId: string;
  cardCount: number;
}

export type CardStrategy = "move" | "delete";

export interface DeleteListOptions {
  strategy?: CardStrategy;
  targetListId?: string;
}

export interface DeleteListResult {
  lists: BoardList[];
  cards: CardsByList;
}

export async function listListsRequest(boardId: string): Promise<BoardList[]> {
  const response = await api.get<{ lists: BoardList[] }>(`/boards/${boardId}/lists`);

  return response.data.lists;
}

export async function createListRequest(boardId: string, name: string): Promise<BoardList> {
  const response = await api.post<{ list: BoardList }>(`/boards/${boardId}/lists`, { name });

  return response.data.list;
}

export async function renameListRequest(
  boardId: string,
  listId: string,
  name: string
): Promise<BoardList> {
  const response = await api.put<{ list: BoardList }>(`/boards/${boardId}/lists/${listId}`, {
    name,
  });

  return response.data.list;
}

export async function moveListRequest(
  boardId: string,
  listId: string,
  position: number
): Promise<BoardList[]> {
  const response = await api.patch<{ lists: BoardList[] }>(
    `/boards/${boardId}/lists/${listId}/position`,
    { position }
  );

  return response.data.lists;
}

export async function deleteListRequest(
  boardId: string,
  listId: string,
  options: DeleteListOptions = {}
): Promise<DeleteListResult> {
  const response = await api.delete<DeleteListResult>(`/boards/${boardId}/lists/${listId}`, {
    data: options,
  });

  return response.data;
}
