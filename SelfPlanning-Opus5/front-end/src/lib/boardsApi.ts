import { api } from "./api";
import { BoardColor } from "./boardColors";
import { MemberRole } from "./membersApi";

export interface Board {
  id: string;
  name: string;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
  role: MemberRole;
  listCount: number;
  cardCount: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardPayload {
  name: string;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
}

export async function listBoardsRequest(): Promise<Board[]> {
  const response = await api.get<{ boards: Board[] }>("/boards");

  return response.data.boards;
}

export async function createBoardRequest(payload: BoardPayload): Promise<Board> {
  const response = await api.post<{ board: Board }>("/boards", payload);

  return response.data.board;
}

export async function updateBoardRequest(id: string, payload: BoardPayload): Promise<Board> {
  const response = await api.put<{ board: Board }>(`/boards/${id}`, payload);

  return response.data.board;
}

export async function deleteBoardRequest(id: string): Promise<void> {
  await api.delete(`/boards/${id}`);
}

export async function showBoardRequest(id: string): Promise<Board> {
  const response = await api.get<{ board: Board }>(`/boards/${id}`);

  return response.data.board;
}
