import type { ApiError } from "@/lib/api";
import type { BoardDetail, BoardMember, BoardSummary } from "@/services/boardService";
import type { MemberView, MembersState } from "@/services/memberService";
import { MESSAGES } from "./messages";
import type { BoardRole } from "./permissions";
import { plural } from "./plural";

/** Avatars in "Meus quadros" and the board header (RF07 spec 2.1, 2.2). */
export const BOARD_AVATARS_MAX = 4;
/** Avatars on the card face (RF07 spec 2.9). */
export const CARD_AVATARS_MAX = 3;

/** First `max` people and how many more exist, for "+K" (RF07 C171). */
export function visibleAvatars<T>(people: readonly T[], max: number): { shown: T[]; extra: number } {
  const limit = Math.max(0, max);
  return { shown: people.slice(0, limit), extra: Math.max(0, people.length - limit) };
}

export function extraAvatarsLabel(extra: number): string {
  return `e mais ${extra} ${extra === 1 ? "pessoa" : "pessoas"}`;
}

export function roleLabel(role: BoardRole): string {
  return role === "admin" ? MESSAGES.roleAdmin : MESSAGES.roleMember;
}

export function roleBadge(role: BoardRole): string {
  return role === "admin" ? MESSAGES.badgeAdmin : MESSAGES.badgeMember;
}

/** "você" on the signed-in account's own row, "ativo" on the others (spec 2.3). */
export function memberStatus(member: Pick<MemberView, "userId">, currentUserId: string | undefined): string {
  return member.userId === currentUserId ? MESSAGES.statusYou : MESSAGES.statusActive;
}

/** "{N} quadros · você é administrador em {M}" (spec 2.1, RN14). */
export function boardsSubtitle(boards: readonly Pick<BoardSummary, "myRole">[]): string {
  const admin = boards.filter((board) => board.myRole === "admin").length;
  return `${plural(boards.length, "quadro", "quadros")} · você é administrador em ${admin}`;
}

export function removeMemberTitle(name: string): string {
  return `Remover ${name} do quadro?`;
}

export function leaveBoardTitle(boardName: string): string {
  return `Sair do quadro "${boardName}"?`;
}

/** Assignees of a card resolved by the board participants; stale ids are not shown (F94). */
export function resolveAssignees(assigneeIds: readonly string[], members: readonly BoardMember[]): BoardMember[] {
  const byId = new Map(members.map((member) => [member.userId, member]));
  return assigneeIds.flatMap((id) => {
    const member = byId.get(id);
    return member ? [member] : [];
  });
}

/** The card face shows the saved assignees right after an action (F93). Nothing else changes. */
export function withCardAssignees(board: BoardDetail, cardId: string, assigneeIds: string[]): BoardDetail {
  let changed = false;
  const lists = board.lists.map((list) => {
    if (!list.cards.some((card) => card.id === cardId)) return list;
    changed = true;
    return { ...list, cards: list.cards.map((card) => (card.id === cardId ? { ...card, assigneeIds } : card)) };
  });
  return changed ? { ...board, lists } : board;
}

/** Role and people of the open board after an action in "Membros do quadro" (C168). */
export function withMembersState(board: BoardDetail, state: MembersState): BoardDetail {
  const members = state.members.map(({ userId, name, email, role }) => ({ userId, name, email, role }));
  return {
    ...board,
    myRole: state.myRole,
    members,
    memberCount: members.length,
    memberPreview: members.slice(0, BOARD_AVATARS_MAX).map(({ userId, name }) => ({ userId, name })),
  };
}

/** An accepted board goes first in the grid, never twice (CA12, C169). */
export function insertBoardFirst(boards: readonly BoardSummary[], board: BoardSummary): BoardSummary[] {
  return [board, ...boards.filter((item) => item.id !== board.id)];
}

export type MemberOperation = "load" | "invite" | "member-role" | "invitation-role" | "cancel" | "remove" | "leave";

/**
 * Table of RF07 plan F90, F91 and C165:
 * - `board-not-found`: the account no longer participates; the board page shows "Quadro não encontrado." (2.10);
 * - `forbidden`: message in the window, and the board and the window are reloaded (CA40);
 * - `show-in-field`: message next to the e-mail field (A58);
 * - `done-and-reload`: already removed or cancelled; treated as success (CB17);
 * - `reload-with-message`: the person or invitation vanished; message and reload (CB05);
 * - `show-in-window`: message in the window, nothing changes (LAST_ADMIN, CE02, CE03).
 */
export type MemberFailureAction =
  | "board-not-found"
  | "forbidden"
  | "show-in-field"
  | "done-and-reload"
  | "reload-with-message"
  | "show-in-window";

const INVITE_FIELD_CODES: readonly string[] = [
  "VALIDATION_ERROR",
  "ALREADY_MEMBER",
  "INVITATION_ALREADY_PENDING",
  "MEMBER_LIMIT_REACHED",
];

export function memberFailureAction(operation: MemberOperation, error: ApiError): MemberFailureAction {
  if (error.code === "BOARD_NOT_FOUND") return "board-not-found";
  if (error.code === "FORBIDDEN") return "forbidden";
  if (operation === "invite" && INVITE_FIELD_CODES.includes(error.code)) return "show-in-field";
  if (error.code === "MEMBER_NOT_FOUND") return operation === "remove" ? "done-and-reload" : "reload-with-message";
  if (error.code === "INVITATION_NOT_FOUND") return operation === "cancel" ? "done-and-reload" : "reload-with-message";
  return "show-in-window";
}

/**
 * "Convites" section (F92): an invitation that no longer exists leaves the section
 * with its message (CA16, CB19); other failures keep it with the message (CE03).
 */
export function invitationFailureAction(error: ApiError): "remove-with-message" | "keep-with-message" {
  return error.code === "INVITATION_NOT_FOUND" ? "remove-with-message" : "keep-with-message";
}

/**
 * "Responsáveis" section (F93):
 * - `card-gone`: the board page handles board or card gone;
 * - `reload`: the person left the board; show the message and reload people and assignees (CB15);
 * - `show-in-section`: message in the section, selection as saved (CE04).
 */
export function assigneeFailureAction(error: ApiError): "card-gone" | "reload" | "show-in-section" {
  if (error.code === "BOARD_NOT_FOUND" || error.code === "CARD_NOT_FOUND") return "card-gone";
  if (error.code === "ASSIGNEE_NOT_MEMBER") return "reload";
  return "show-in-section";
}

/** Initial of an invitation avatar: the first character of the e-mail (spec 2.3). */
export function emailInitial(email: string): string {
  return (Array.from(email.trim())[0] ?? "").toUpperCase();
}

const AVATAR_COLORS = ["#2f6fb3", "#7c5cc4", "#2e8b67", "#d08c1f", "#1d3355", "#b4535b"] as const;

/** Stable color per person, so the same participant looks the same everywhere. */
export function avatarColor(key: string): string {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0];
}
