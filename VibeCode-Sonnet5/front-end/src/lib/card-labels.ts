import { api } from "./api";

export async function attachLabel(
  boardId: string,
  cardId: string,
  labelId: string,
): Promise<void> {
  await api.post(`/boards/${boardId}/cards/${cardId}/labels`, { labelId });
}

export async function detachLabel(
  boardId: string,
  cardId: string,
  labelId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/cards/${cardId}/labels/${labelId}`);
}
