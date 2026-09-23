import { api } from "@/lib/api";

export const BOARD_MEMBER_ROLES = ["admin", "member"] as const;
export type BoardMemberRole = (typeof BOARD_MEMBER_ROLES)[number];

export interface BoardMember {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  role: BoardMemberRole;
  status: "active" | "pending";
  isOwner: boolean;
}

export interface InviteBoardMemberInput {
  email: string;
  role: BoardMemberRole;
}

export async function listBoardMembers(
  boardId: string,
): Promise<BoardMember[]> {
  const response = await api.get<{ members: BoardMember[] }>(
    `/boards/${boardId}/members`,
  );

  return response.data.members;
}

export async function inviteBoardMember(
  boardId: string,
  input: InviteBoardMemberInput,
): Promise<BoardMember> {
  const response = await api.post<{ member: BoardMember }>(
    `/boards/${boardId}/members`,
    input,
  );

  return response.data.member;
}

export async function updateBoardMemberRole(
  boardId: string,
  memberId: string,
  role: BoardMemberRole,
): Promise<BoardMember> {
  const response = await api.patch<{ member: BoardMember }>(
    `/boards/${boardId}/members/${memberId}`,
    { role },
  );

  return response.data.member;
}

export async function removeBoardMember(
  boardId: string,
  memberId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/members/${memberId}`);
}
