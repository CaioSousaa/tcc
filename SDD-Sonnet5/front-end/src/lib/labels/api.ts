import { apiClient } from "@/lib/auth/api-client";

export const LABEL_COLORS = [
  "verde",
  "amarelo",
  "laranja",
  "vermelho",
  "roxo",
  "azul",
  "ciano",
  "cinza",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabelInput {
  name: string;
  color: LabelColor;
}

export interface UpdateLabelInput {
  name?: string;
  color?: LabelColor;
}

function base(boardId: string) {
  return `/boards/${boardId}/labels`;
}

export async function listLabels(boardId: string): Promise<Label[]> {
  const response = await apiClient.get<{ labels: Label[] }>(base(boardId));
  return response.data.labels;
}

export async function createLabel(boardId: string, input: CreateLabelInput): Promise<Label> {
  const response = await apiClient.post<Label>(base(boardId), input);
  return response.data;
}

export async function updateLabel(
  boardId: string,
  labelId: string,
  input: UpdateLabelInput,
): Promise<Label> {
  const response = await apiClient.patch<Label>(`${base(boardId)}/${labelId}`, input);
  return response.data;
}

export async function deleteLabel(boardId: string, labelId: string): Promise<void> {
  await apiClient.delete(`${base(boardId)}/${labelId}`);
}
