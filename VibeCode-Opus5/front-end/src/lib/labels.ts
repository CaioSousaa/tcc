import { api } from "@/lib/api";

export const LABEL_COLORS = [
  "red",
  "blue",
  "green",
  "amber",
  "purple",
  "gray",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_COLOR_HEX: Record<LabelColor, string> = {
  red: "#c0392b",
  blue: "#2f80c4",
  green: "#2e8b57",
  amber: "#d9a32b",
  purple: "#8b5cf6",
  gray: "#6b7a8d",
};

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelInput {
  name: string;
  color: LabelColor;
}

export async function listLabels(boardId: string): Promise<Label[]> {
  const response = await api.get<{ labels: Label[] }>(
    `/boards/${boardId}/labels`,
  );

  return response.data.labels;
}

export async function createLabel(
  boardId: string,
  input: LabelInput,
): Promise<Label> {
  const response = await api.post<{ label: Label }>(
    `/boards/${boardId}/labels`,
    input,
  );

  return response.data.label;
}

export async function updateLabel(
  boardId: string,
  labelId: string,
  input: Partial<LabelInput>,
): Promise<Label> {
  const response = await api.patch<{ label: Label }>(
    `/boards/${boardId}/labels/${labelId}`,
    input,
  );

  return response.data.label;
}

export async function deleteLabel(
  boardId: string,
  labelId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/labels/${labelId}`);
}
