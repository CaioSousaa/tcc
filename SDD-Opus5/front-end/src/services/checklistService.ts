import { api } from "@/lib/api";

export type ChecklistItem = { id: string; text: string; done: boolean; position: number };
export type ChecklistItemChanges = { text?: string; done?: boolean };

const items = (boardId: string, cardId: string, itemId?: string) => {
  const base = `/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/checklist-items`;
  return itemId ? `${base}/${encodeURIComponent(itemId)}` : base;
};

// Every response carries the whole checklist of the card (RF06 C128).
export const checklistService = {
  async add(boardId: string, cardId: string, text: string): Promise<{ item: ChecklistItem; checklist: ChecklistItem[] }> {
    const { data } = await api.post<{ item: ChecklistItem; checklist: ChecklistItem[] }>(items(boardId, cardId), { text });
    return data;
  },

  /** Marking sends only `done`; editing sends only `text` (RF06 plan 4.8). */
  async update(
    boardId: string,
    cardId: string,
    itemId: string,
    changes: ChecklistItemChanges,
  ): Promise<{ item: ChecklistItem; checklist: ChecklistItem[] }> {
    const { data } = await api.patch<{ item: ChecklistItem; checklist: ChecklistItem[] }>(items(boardId, cardId, itemId), changes);
    return data;
  },

  async remove(boardId: string, cardId: string, itemId: string): Promise<ChecklistItem[]> {
    const { data } = await api.delete<{ checklist: ChecklistItem[] }>(items(boardId, cardId, itemId));
    return data.checklist;
  },
};
