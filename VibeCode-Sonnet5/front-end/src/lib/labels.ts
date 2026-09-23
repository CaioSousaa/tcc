import { api } from "./api";

export const LABEL_COLORS = ["red", "blue", "green", "gold", "purple", "gray"] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
  cardCount: number;
  createdAt: string;
}

export async function fetchLabels(boardId: string): Promise<Label[]> {
  const { data } = await api.get<{ labels: Label[] }>(
    `/boards/${boardId}/labels`,
  );
  return data.labels;
}

export async function createLabel(
  boardId: string,
  input: { name: string; color: LabelColor },
): Promise<Label> {
  const { data } = await api.post<{ label: Label }>(
    `/boards/${boardId}/labels`,
    input,
  );
  return data.label;
}

export async function deleteLabel(boardId: string, labelId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/labels/${labelId}`);
}
