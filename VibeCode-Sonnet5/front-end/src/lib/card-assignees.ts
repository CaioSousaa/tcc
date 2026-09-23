import { api } from "./api";

export interface CardAssignee {
  userId: string;
  name: string;
  email: string;
}

export async function fetchAssignees(
  boardId: string,
  cardId: string,
): Promise<CardAssignee[]> {
  const { data } = await api.get<{ assignees: CardAssignee[] }>(
    `/boards/${boardId}/cards/${cardId}/assignees`,
  );
  return data.assignees;
}

export async function assignCard(
  boardId: string,
  cardId: string,
  userId: string,
): Promise<void> {
  await api.post(`/boards/${boardId}/cards/${cardId}/assignees`, { userId });
}

export async function unassignCard(
  boardId: string,
  cardId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/cards/${cardId}/assignees/${userId}`);
}
