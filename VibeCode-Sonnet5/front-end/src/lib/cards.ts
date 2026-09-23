import { api } from "./api";
import { LabelColor } from "./labels";

export interface Card {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  position: number;
  listId: string;
  boardId: string;
  checklistTotal: number;
  checklistCompleted: number;
  assignees: { userId: string; name: string }[];
  labels: { id: string; name: string; color: LabelColor }[];
  createdAt: string;
  updatedAt: string;
}

export async function fetchCards(boardId: string): Promise<Card[]> {
  const { data } = await api.get<{ cards: Card[] }>(`/boards/${boardId}/cards`);
  return data.cards;
}

export async function createCard(
  boardId: string,
  input: {
    listId: string;
    title: string;
    description?: string;
    dueDate?: string | null;
  },
): Promise<Card> {
  const { data } = await api.post<{ card: Card }>(
    `/boards/${boardId}/cards`,
    input,
  );
  return data.card;
}

export async function updateCard(
  boardId: string,
  cardId: string,
  input: {
    title?: string;
    description?: string | null;
    listId?: string;
    position?: number;
    dueDate?: string | null;
  },
): Promise<Card> {
  const { data } = await api.patch<{ card: Card }>(
    `/boards/${boardId}/cards/${cardId}`,
    input,
  );
  return data.card;
}

export async function deleteCard(boardId: string, cardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/cards/${cardId}`);
}
