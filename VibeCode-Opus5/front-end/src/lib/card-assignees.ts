import { api } from "@/lib/api";

export interface CardAssignee {
  id: string;
  cardId: string;
  userId: string;
}

export async function listCardAssignees(
  boardId: string,
): Promise<CardAssignee[]> {
  const response = await api.get<{ assignees: CardAssignee[] }>(
    `/boards/${boardId}/card-assignees`,
  );

  return response.data.assignees;
}

export async function assignCard(
  boardId: string,
  input: { cardId: string; userId: string },
): Promise<CardAssignee> {
  const response = await api.post<{ assignee: CardAssignee }>(
    `/boards/${boardId}/card-assignees`,
    input,
  );

  return response.data.assignee;
}

export async function unassignCard(
  boardId: string,
  assigneeId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/card-assignees/${assigneeId}`);
}
