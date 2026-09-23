import { api } from "@/lib/api";

export interface CardLabel {
  id: string;
  cardId: string;
  labelId: string;
}

export async function listCardLabels(boardId: string): Promise<CardLabel[]> {
  const response = await api.get<{ cardLabels: CardLabel[] }>(
    `/boards/${boardId}/card-labels`,
  );

  return response.data.cardLabels;
}

export async function assignLabel(
  boardId: string,
  input: { cardId: string; labelId: string },
): Promise<CardLabel> {
  const response = await api.post<{ cardLabel: CardLabel }>(
    `/boards/${boardId}/card-labels`,
    input,
  );

  return response.data.cardLabel;
}

export async function unassignLabel(
  boardId: string,
  cardLabelId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/card-labels/${cardLabelId}`);
}
