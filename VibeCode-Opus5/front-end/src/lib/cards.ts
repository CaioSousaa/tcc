import { api } from "@/lib/api";

export interface BoardCard {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardInput {
  listId: string;
  title: string;
  description?: string | null;
  position?: number;
  dueDate?: string | null;
}

export interface UpdateCardInput {
  title?: string;
  description?: string | null;
  listId?: string;
  position?: number;
  dueDate?: string | null;
}

export async function listCards(boardId: string): Promise<BoardCard[]> {
  const response = await api.get<{ cards: BoardCard[] }>(
    `/boards/${boardId}/cards`,
  );

  return response.data.cards;
}

export async function createCard(
  boardId: string,
  input: CreateCardInput,
): Promise<BoardCard> {
  const response = await api.post<{ card: BoardCard }>(
    `/boards/${boardId}/cards`,
    input,
  );

  return response.data.card;
}

export async function updateCard(
  boardId: string,
  cardId: string,
  input: UpdateCardInput,
): Promise<BoardCard> {
  const response = await api.patch<{ card: BoardCard }>(
    `/boards/${boardId}/cards/${cardId}`,
    input,
  );

  return response.data.card;
}

export async function deleteCard(
  boardId: string,
  cardId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/cards/${cardId}`);
}
