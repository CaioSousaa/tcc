import type { BoardColor } from "./boardColors";
import type { BoardRole } from "./permissions";

/** Participants plus pending invitations of one board (RF07 RN12). */
export const BOARD_PEOPLE_MAX = 50;

/** Avatars in the "Meus quadros" card (RF07 spec 2.1). */
export const MEMBER_PREVIEW_MAX = 4;

export type MemberView = {
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
  joinedAt: string;
};

export type InvitationView = {
  id: string;
  email: string;
  role: BoardRole;
  createdAt: string;
};

/** Full state of the "Membros do quadro" window; every member write answers with it (C164). */
export type MembersState = {
  myRole: BoardRole;
  members: MemberView[];
  invitations: InvitationView[];
};

/** Invitation as seen by the invited account: the inviter's e-mail is never exposed (N145). */
export type UserInvitationView = {
  id: string;
  role: BoardRole;
  createdAt: string;
  board: { id: string; name: string; color: BoardColor };
  invitedBy: { name: string };
};

export type AssigneeRef = { userId: string; name: string };

export type MemberPreview = { userId: string; name: string };

/** Participant of an open board, used by the interface to resolve avatars (F94). */
export type BoardMember = { userId: string; name: string; email: string; role: BoardRole };
