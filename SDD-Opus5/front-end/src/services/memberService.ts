import { api } from "@/lib/api";
import type { BoardRole } from "@/lib/permissions";

export type MemberView = { userId: string; name: string; email: string; role: BoardRole; joinedAt: string };
export type InvitationView = { id: string; email: string; role: BoardRole; createdAt: string };
export type MembersState = { myRole: BoardRole; members: MemberView[]; invitations: InvitationView[] };

const board = (boardId: string) => `/boards/${encodeURIComponent(boardId)}`;

// Every write answers with the full state of the window (RF07 C164).
export const memberService = {
  async get(boardId: string): Promise<MembersState> {
    const { data } = await api.get<MembersState>(`${board(boardId)}/members`);
    return data;
  },

  async invite(boardId: string, email: string, role: BoardRole): Promise<MembersState> {
    const { data } = await api.post<MembersState>(`${board(boardId)}/invitations`, { email, role });
    return data;
  },

  async updateInvitation(boardId: string, invitationId: string, role: BoardRole): Promise<MembersState> {
    const { data } = await api.patch<MembersState>(`${board(boardId)}/invitations/${encodeURIComponent(invitationId)}`, { role });
    return data;
  },

  async cancelInvitation(boardId: string, invitationId: string): Promise<MembersState> {
    const { data } = await api.delete<MembersState>(`${board(boardId)}/invitations/${encodeURIComponent(invitationId)}`);
    return data;
  },

  async updateMember(boardId: string, userId: string, role: BoardRole): Promise<MembersState> {
    const { data } = await api.patch<MembersState>(`${board(boardId)}/members/${encodeURIComponent(userId)}`, { role });
    return data;
  },

  /** Removing oneself is leaving: the API answers `{ left: true }` (RF07 A53). */
  async removeMember(boardId: string, userId: string): Promise<MembersState | { left: true }> {
    const { data } = await api.delete<MembersState | { left: true }>(`${board(boardId)}/members/${encodeURIComponent(userId)}`);
    return data;
  },
};
