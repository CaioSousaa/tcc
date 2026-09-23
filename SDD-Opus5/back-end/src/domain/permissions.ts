import { AppError } from "../errors/AppError";

export const BOARD_ROLES = ["admin", "member"] as const;

/** Every participant has exactly one of these roles (RF07 RN03). */
export type BoardRole = (typeof BOARD_ROLES)[number];

export function isBoardRole(value: unknown): value is BoardRole {
  return typeof value === "string" && (BOARD_ROLES as readonly string[]).includes(value);
}

/** Closed set of actions checked against the role (RF07 plan F78). */
export type BoardAction =
  | "board.update"
  | "board.delete"
  | "list.manage"
  | "card.write"
  | "checklist.write"
  | "assignee.write"
  | "members.manage"
  | "members.leave"
  | "labels.manage"
  | "labels.apply"
  | "comments.write"
  | "comments.moderate"
  | "dueDate.write";

/**
 * Permission matrix of RF07 RN05. Reading the board is granted by participation
 * alone and is not listed. "members.leave" is allowed to both roles; the last
 * administrator rule (RN04) is a state rule checked by the service.
 */
export const PERMISSIONS: Record<BoardAction, Record<BoardRole, boolean>> = {
  "board.update": { admin: true, member: false },
  "board.delete": { admin: true, member: false },
  "list.manage": { admin: true, member: false },
  "card.write": { admin: true, member: true },
  "checklist.write": { admin: true, member: true },
  "assignee.write": { admin: true, member: true },
  "members.manage": { admin: true, member: false },
  "members.leave": { admin: true, member: true },
  "labels.manage": { admin: true, member: false },
  "labels.apply": { admin: true, member: true },
  "comments.write": { admin: true, member: true },
  /** Delete comments written by someone else (RF09 F119). */
  "comments.moderate": { admin: true, member: false },
  "dueDate.write": { admin: true, member: true },
};

export function can(role: BoardRole, action: BoardAction): boolean {
  return PERMISSIONS[action][role];
}

/** Services call this instead of comparing roles (C146). */
export function assertCan(role: BoardRole, action: BoardAction): void {
  if (!can(role, action)) throw new AppError("FORBIDDEN");
}
