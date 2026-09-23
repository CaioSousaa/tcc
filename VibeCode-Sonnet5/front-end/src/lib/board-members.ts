import { api } from "./api";
import { BoardRole } from "./boards";

export interface BoardMember {
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
  isOwner: boolean;
}

export async function fetchMembers(boardId: string): Promise<BoardMember[]> {
  const { data } = await api.get<{ members: BoardMember[] }>(
    `/boards/${boardId}/members`,
  );
  return data.members;
}

export async function inviteMember(
  boardId: string,
  input: { email: string; role: "admin" | "member" },
): Promise<BoardMember> {
  const { data } = await api.post<{ member: BoardMember }>(
    `/boards/${boardId}/members`,
    input,
  );
  return data.member;
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: "admin" | "member",
): Promise<BoardMember> {
  const { data } = await api.patch<{ member: BoardMember }>(
    `/boards/${boardId}/members/${userId}`,
    { role },
  );
  return data.member;
}

export async function removeMember(
  boardId: string,
  userId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/members/${userId}`);
}
