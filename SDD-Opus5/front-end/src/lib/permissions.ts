/** Same roles and matrix as back-end/src/domain/permissions.ts (RF07 RN05). */
export type BoardRole = "admin" | "member";

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

const PERMISSIONS: Record<BoardAction, Record<BoardRole, boolean>> = {
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
  "comments.moderate": { admin: true, member: false },
  "dueDate.write": { admin: true, member: true },
};

/**
 * Only decides which controls are shown, always from the role returned by the
 * API; the server still checks every action (RF07 F88, RN06).
 */
export function can(role: BoardRole, action: BoardAction): boolean {
  return PERMISSIONS[action][role];
}
