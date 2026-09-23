import { api } from "@/lib/api";

export const BOARD_COLORS = [
  "navy",
  "blue",
  "green",
  "amber",
  "purple",
] as const;

export type BoardColor = (typeof BOARD_COLORS)[number];

export const BOARD_COLOR_HEX: Record<BoardColor, string> = {
  navy: "#1e3a5f",
  blue: "#2f80c4",
  green: "#2e8b57",
  amber: "#d9a32b",
  purple: "#8b5cf6",
};

export interface Board {
  id: string;
  title: string;
  color: BoardColor;
  role: "admin" | "member";
  createdAt: string;
  updatedAt: string;
}

export interface BoardInput {
  title: string;
  color: BoardColor;
}

export async function getBoard(boardId: string): Promise<Board> {
  const response = await api.get<{ board: Board }>(`/boards/${boardId}`);

  return response.data.board;
}

export async function listBoards(): Promise<Board[]> {
  const response = await api.get<{ boards: Board[] }>("/boards");

  return response.data.boards;
}

export async function createBoard(input: BoardInput): Promise<Board> {
  const response = await api.post<{ board: Board }>("/boards", input);

  return response.data.board;
}

export async function updateBoard(
  boardId: string,
  input: BoardInput,
): Promise<Board> {
  const response = await api.patch<{ board: Board }>(
    `/boards/${boardId}`,
    input,
  );

  return response.data.board;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`);
}
