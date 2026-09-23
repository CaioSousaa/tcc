import { apiClient } from "@/lib/auth/api-client";

export type BoardMemberRole = "administrador" | "membro";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  role: BoardMemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  name: string;
  description?: string;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string | null;
}

export async function listBoards(): Promise<Board[]> {
  const response = await apiClient.get<{ boards: Board[] }>("/boards");
  return response.data.boards;
}

export async function getBoard(id: string): Promise<Board> {
  const response = await apiClient.get<Board>(`/boards/${id}`);
  return response.data;
}

export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const response = await apiClient.post<Board>("/boards", input);
  return response.data;
}

export async function updateBoard(id: string, input: UpdateBoardInput): Promise<Board> {
  const response = await apiClient.patch<Board>(`/boards/${id}`, input);
  return response.data;
}

export async function deleteBoard(id: string): Promise<void> {
  await apiClient.delete(`/boards/${id}`);
}
