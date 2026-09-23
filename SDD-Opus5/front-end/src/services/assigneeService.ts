import { api } from "@/lib/api";

export type AssigneeRef = { userId: string; name: string };

const assignee = (boardId: string, cardId: string, userId: string) =>
  `/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/assignees/${encodeURIComponent(userId)}`;

// PUT and DELETE are idempotent and answer with every assignee of the card (RF07 A55).
export const assigneeService = {
  async assign(boardId: string, cardId: string, userId: string): Promise<AssigneeRef[]> {
    const { data } = await api.put<{ assignees: AssigneeRef[] }>(assignee(boardId, cardId, userId));
    return data.assignees;
  },

  async unassign(boardId: string, cardId: string, userId: string): Promise<AssigneeRef[]> {
    const { data } = await api.delete<{ assignees: AssigneeRef[] }>(assignee(boardId, cardId, userId));
    return data.assignees;
  },
};
