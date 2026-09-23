import { api } from "@/lib/api";
import type { BoardListItem } from "./boardService";

export type ListPayload = { name: string; position: number };

export type ListDeletionDecision =
  | { strategy: "move"; targetListId: string; expectedCardCount: number }
  | { strategy: "cascade"; expectedCardCount: number };

export function deletionQuery(decision: ListDeletionDecision): URLSearchParams {
  const params = new URLSearchParams({ strategy: decision.strategy, expectedCardCount: String(decision.expectedCardCount) });
  if (decision.strategy === "move") params.set("targetListId", decision.targetListId);
  return params;
}
export type ListMutation = { list: BoardListItem; lists: BoardListItem[] };

function listsUrl(boardId: string, listId?: string): string {
  const base = `/boards/${encodeURIComponent(boardId)}/lists`;
  return listId ? `${base}/${encodeURIComponent(listId)}` : base;
}

// Every response carries the whole saved order of the board (plan C56).
export const listService = {
  async create(boardId: string, payload: ListPayload): Promise<ListMutation> {
    const { data } = await api.post<ListMutation>(listsUrl(boardId), payload);
    return data;
  },

  async update(boardId: string, listId: string, payload: ListPayload): Promise<ListMutation> {
    const { data } = await api.patch<ListMutation>(listsUrl(boardId, listId), payload);
    return data;
  },

  /**
   * Without a decision: empty list (RF03). With a decision: list with cards (RF05).
   * Parameters are built with URLSearchParams, never concatenated (C115).
   */
  async remove(boardId: string, listId: string, decision?: ListDeletionDecision): Promise<BoardListItem[]> {
    const query = decision ? `?${deletionQuery(decision).toString()}` : "";
    const { data } = await api.delete<{ lists: BoardListItem[] }>(`${listsUrl(boardId, listId)}${query}`);
    return data.lists;
  },
};
