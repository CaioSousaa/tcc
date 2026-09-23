import { api } from "./api";
import { CardAssignee } from "./membersApi";
import { Label } from "./labelsApi";

export interface Card {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  position: number;
  listId: string;
  checklistTotal: number;
  checklistDone: number;
  assignees: CardAssignee[];
  labels: Label[];
  commentCount: number;
  dueStatus: "overdue" | "today" | "upcoming" | null;
}

export interface CardQueryOptions {
  labelIds?: string[];
  sortByDueDate?: boolean;
  overdueOnly?: boolean;
}

export type CardsByList = Record<string, Card[]>;

export interface CardPayload {
  title: string;
  description: string | null;
  dueDate: string | null;
}

export async function listCardsRequest(
  boardId: string,
  options: CardQueryOptions = {}
): Promise<CardsByList> {
  const params: Record<string, string> = {};

  if (options.labelIds && options.labelIds.length > 0) {
    params.labelIds = options.labelIds.join(",");
  }

  if (options.sortByDueDate) {
    params.sort = "dueDate";
  }

  if (options.overdueOnly) {
    params.overdue = "true";
  }

  const response = await api.get<{ cards: CardsByList }>(`/boards/${boardId}/cards`, {
    params: Object.keys(params).length > 0 ? params : undefined,
  });

  return response.data.cards;
}

export async function createCardRequest(
  boardId: string,
  listId: string,
  payload: CardPayload
): Promise<Card> {
  const response = await api.post<{ card: Card }>(`/boards/${boardId}/cards`, {
    listId,
    ...payload,
  });

  return response.data.card;
}

export async function updateCardRequest(
  boardId: string,
  cardId: string,
  payload: CardPayload
): Promise<Card> {
  const response = await api.put<{ card: Card }>(`/boards/${boardId}/cards/${cardId}`, payload);

  return response.data.card;
}

export async function moveCardRequest(
  boardId: string,
  cardId: string,
  listId: string,
  position: number
): Promise<CardsByList> {
  const response = await api.patch<{ cards: CardsByList }>(
    `/boards/${boardId}/cards/${cardId}/position`,
    { listId, position }
  );

  return response.data.cards;
}

export async function deleteCardRequest(boardId: string, cardId: string): Promise<CardsByList> {
  const response = await api.delete<{ cards: CardsByList }>(
    `/boards/${boardId}/cards/${cardId}`
  );

  return response.data.cards;
}
