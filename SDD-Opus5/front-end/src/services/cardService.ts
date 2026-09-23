import { api } from "@/lib/api";
import type { CardPayload } from "@/schemas/card";
import type { BoardListItem, CardSummary } from "./boardService";
import type { AssigneeRef } from "./assigneeService";
import type { ChecklistItem } from "./checklistService";
import type { CommentView } from "./commentService";

export type CardDetail = {
  id: string;
  title: string;
  description: string | null;
  listId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  checklist: ChecklistItem[];
  /** In order of assignment (RF07 RN13). */
  assignees: AssigneeRef[];
  /** In label order (RF08 RN11). */
  labelIds: string[];
  /** History oldest first (RF09 RN04). */
  comments: CommentView[];
  /** YYYY-MM-DD or null (RF10). */
  dueDate: string | null;
};

const board = (boardId: string) => `/boards/${encodeURIComponent(boardId)}`;

// Write responses carry the affected lists with their cards (RF04 C81).
export const cardService = {
  async create(boardId: string, listId: string, title: string): Promise<{ card: CardSummary; lists: BoardListItem[] }> {
    const { data } = await api.post<{ card: CardSummary; lists: BoardListItem[] }>(
      `${board(boardId)}/lists/${encodeURIComponent(listId)}/cards`,
      { title },
    );
    return data;
  },

  async get(boardId: string, cardId: string): Promise<CardDetail> {
    const { data } = await api.get<{ card: CardDetail }>(`${board(boardId)}/cards/${encodeURIComponent(cardId)}`);
    return data.card;
  },

  async update(boardId: string, cardId: string, payload: CardPayload): Promise<{ card: CardDetail; lists: BoardListItem[] }> {
    const { data } = await api.patch<{ card: CardDetail; lists: BoardListItem[] }>(
      `${board(boardId)}/cards/${encodeURIComponent(cardId)}`,
      payload,
    );
    return data;
  },

  async remove(boardId: string, cardId: string): Promise<BoardListItem[]> {
    const { data } = await api.delete<{ lists: BoardListItem[] }>(`${board(boardId)}/cards/${encodeURIComponent(cardId)}`);
    return data.lists;
  },
};
