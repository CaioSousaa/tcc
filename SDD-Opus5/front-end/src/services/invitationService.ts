import { api } from "@/lib/api";
import type { BoardColor } from "@/lib/boardColors";
import type { BoardRole } from "@/lib/permissions";
import type { BoardSummary } from "./boardService";

export type UserInvitation = {
  id: string;
  role: BoardRole;
  createdAt: string;
  board: { id: string; name: string; color: BoardColor };
  invitedBy: { name: string };
};

const invitation = (id: string) => `/invitations/${encodeURIComponent(id)}`;

export const invitationService = {
  /** Invitations of the signed-in e-mail, newest first (RF07 CB09). */
  async list(): Promise<UserInvitation[]> {
    const { data } = await api.get<{ invitations: UserInvitation[] }>("/invitations");
    return data.invitations;
  },

  /** `today` of the device for the overdue count of the accepted board (RF10 A70). */
  async accept(id: string, today: string): Promise<BoardSummary> {
    const { data } = await api.post<{ board: BoardSummary }>(`${invitation(id)}/accept`, undefined, { params: { today } });
    return data.board;
  },

  async decline(id: string): Promise<void> {
    await api.post(`${invitation(id)}/decline`);
  },
};
