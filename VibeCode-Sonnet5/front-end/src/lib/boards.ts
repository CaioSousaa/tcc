import { api } from "./api";

export const BOARD_COLORS = ["navy", "blue", "green", "gold", "purple"] as const;
export type BoardColor = (typeof BOARD_COLORS)[number];

export type BoardRole = "owner" | "admin" | "member";

export interface Board {
  id: string;
  title: string;
  color: BoardColor;
  role: BoardRole;
  createdAt: string;
  updatedAt: string;
}

export async function fetchBoards(): Promise<Board[]> {
  const { data } = await api.get<{ boards: Board[] }>("/boards");
  return data.boards;
}

export async function fetchBoard(id: string): Promise<Board> {
  const { data } = await api.get<{ board: Board }>(`/boards/${id}`);
  return data.board;
}

export async function createBoard(input: {
  title: string;
  color: BoardColor;
}): Promise<Board> {
  const { data } = await api.post<{ board: Board }>("/boards", input);
  return data.board;
}

export async function updateBoard(
  id: string,
  input: { title?: string; color?: BoardColor },
): Promise<Board> {
  const { data } = await api.patch<{ board: Board }>(`/boards/${id}`, input);
  return data.board;
}

export async function deleteBoard(id: string): Promise<void> {
  await api.delete(`/boards/${id}`);
}
