import { api } from "./api";

export type MemberRole = "admin" | "member";
export type MemberStatus = "active" | "pending";

export interface BoardMember {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  role: MemberRole;
  status: MemberStatus;
}

export interface CardAssignee {
  memberId: string;
  name: string | null;
  email: string;
}

export async function listMembersRequest(boardId: string): Promise<BoardMember[]> {
  const response = await api.get<{ members: BoardMember[] }>(`/boards/${boardId}/members`);

  return response.data.members;
}

export async function inviteMemberRequest(
  boardId: string,
  email: string,
  role: MemberRole
): Promise<BoardMember[]> {
  const response = await api.post<{ members: BoardMember[] }>(`/boards/${boardId}/members`, {
    email,
    role,
  });

  return response.data.members;
}

export async function updateMemberRoleRequest(
  boardId: string,
  memberId: string,
  role: MemberRole
): Promise<BoardMember[]> {
  const response = await api.patch<{ members: BoardMember[] }>(
    `/boards/${boardId}/members/${memberId}/role`,
    { role }
  );

  return response.data.members;
}

export async function removeMemberRequest(
  boardId: string,
  memberId: string
): Promise<BoardMember[]> {
  const response = await api.delete<{ members: BoardMember[] }>(
    `/boards/${boardId}/members/${memberId}`
  );

  return response.data.members;
}

export async function assignMemberRequest(
  boardId: string,
  cardId: string,
  memberId: string
): Promise<CardAssignee[]> {
  const response = await api.post<{ assignees: CardAssignee[] }>(
    `/boards/${boardId}/cards/${cardId}/assignees`,
    { memberId }
  );

  return response.data.assignees;
}

export async function unassignMemberRequest(
  boardId: string,
  cardId: string,
  memberId: string
): Promise<CardAssignee[]> {
  const response = await api.delete<{ assignees: CardAssignee[] }>(
    `/boards/${boardId}/cards/${cardId}/assignees/${memberId}`
  );

  return response.data.assignees;
}
