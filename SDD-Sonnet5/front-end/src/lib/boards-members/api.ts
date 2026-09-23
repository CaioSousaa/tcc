import { apiClient } from "@/lib/auth/api-client";
import { BoardMemberRole } from "@/lib/boards/api";

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: BoardMemberRole;
}

function base(boardId: string) {
  return `/boards/${boardId}/members`;
}

export async function listMembers(boardId: string): Promise<Member[]> {
  const response = await apiClient.get<{ members: Member[] }>(base(boardId));
  return response.data.members;
}

export async function inviteMember(
  boardId: string,
  email: string,
  role: BoardMemberRole,
): Promise<Member> {
  const response = await apiClient.post<Member>(base(boardId), { email, role });
  return response.data;
}

export async function updateMemberRole(
  boardId: string,
  userId: string,
  role: BoardMemberRole,
): Promise<void> {
  await apiClient.patch(`${base(boardId)}/${userId}`, { role });
}

export async function removeMember(boardId: string, userId: string): Promise<void> {
  await apiClient.delete(`${base(boardId)}/${userId}`);
}

export async function leaveBoard(boardId: string): Promise<void> {
  await apiClient.delete(`${base(boardId)}/me`);
}
