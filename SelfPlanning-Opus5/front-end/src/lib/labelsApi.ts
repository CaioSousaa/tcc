import { api } from "./api";
import { LabelColor } from "./labelColors";

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
  boardId: string;
}

export interface LabelWithCount extends Label {
  cardCount: number;
}

export async function listLabelsRequest(boardId: string): Promise<LabelWithCount[]> {
  const response = await api.get<{ labels: LabelWithCount[] }>(`/boards/${boardId}/labels`);

  return response.data.labels;
}

export async function createLabelRequest(
  boardId: string,
  name: string,
  color: LabelColor
): Promise<LabelWithCount[]> {
  const response = await api.post<{ labels: LabelWithCount[] }>(`/boards/${boardId}/labels`, {
    name,
    color,
  });

  return response.data.labels;
}

export async function updateLabelRequest(
  boardId: string,
  labelId: string,
  name: string,
  color: LabelColor
): Promise<LabelWithCount[]> {
  const response = await api.put<{ labels: LabelWithCount[] }>(
    `/boards/${boardId}/labels/${labelId}`,
    { name, color }
  );

  return response.data.labels;
}

export async function deleteLabelRequest(
  boardId: string,
  labelId: string
): Promise<LabelWithCount[]> {
  const response = await api.delete<{ labels: LabelWithCount[] }>(
    `/boards/${boardId}/labels/${labelId}`
  );

  return response.data.labels;
}

export async function applyLabelRequest(
  boardId: string,
  cardId: string,
  labelId: string
): Promise<Label[]> {
  const response = await api.post<{ labels: Label[] }>(
    `/boards/${boardId}/cards/${cardId}/labels`,
    { labelId }
  );

  return response.data.labels;
}

export async function removeLabelRequest(
  boardId: string,
  cardId: string,
  labelId: string
): Promise<Label[]> {
  const response = await api.delete<{ labels: Label[] }>(
    `/boards/${boardId}/cards/${cardId}/labels/${labelId}`
  );

  return response.data.labels;
}
