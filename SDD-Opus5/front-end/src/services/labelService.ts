import { api } from "@/lib/api";
import type { LabelColor } from "@/lib/labelColors";

export type LabelView = { id: string; name: string; color: LabelColor; usage: number };
export type CardLabelsState = { labelIds: string[]; labels: LabelView[] };

const board = (boardId: string) => `/boards/${encodeURIComponent(boardId)}`;
const label = (boardId: string, labelId: string) => `${board(boardId)}/labels/${encodeURIComponent(labelId)}`;
const cardLabel = (boardId: string, cardId: string, labelId: string) =>
  `${board(boardId)}/cards/${encodeURIComponent(cardId)}/labels/${encodeURIComponent(labelId)}`;

// Every write answers with all labels of the board and their usage (RF08 C195).
export const labelService = {
  async list(boardId: string): Promise<LabelView[]> {
    const { data } = await api.get<{ labels: LabelView[] }>(`${board(boardId)}/labels`);
    return data.labels;
  },

  async create(boardId: string, name: string, color: LabelColor): Promise<{ label: LabelView; labels: LabelView[] }> {
    const { data } = await api.post<{ label: LabelView; labels: LabelView[] }>(`${board(boardId)}/labels`, { name, color });
    return data;
  },

  async update(
    boardId: string,
    labelId: string,
    name: string,
    color: LabelColor,
  ): Promise<{ label: LabelView; labels: LabelView[] }> {
    const { data } = await api.patch<{ label: LabelView; labels: LabelView[] }>(label(boardId, labelId), { name, color });
    return data;
  },

  async remove(boardId: string, labelId: string): Promise<LabelView[]> {
    const { data } = await api.delete<{ labels: LabelView[] }>(label(boardId, labelId));
    return data.labels;
  },

  /** Idempotent, without body (A61). */
  async apply(boardId: string, cardId: string, labelId: string): Promise<CardLabelsState> {
    const { data } = await api.put<CardLabelsState>(cardLabel(boardId, cardId, labelId));
    return data;
  },

  async unapply(boardId: string, cardId: string, labelId: string): Promise<CardLabelsState> {
    const { data } = await api.delete<CardLabelsState>(cardLabel(boardId, cardId, labelId));
    return data;
  },
};
