export const MEMBER_ROLES = ["admin", "member"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["active", "pending"] as const;

export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export function isMemberRole(value: unknown): value is MemberRole {
  return typeof value === "string" && MEMBER_ROLES.includes(value as MemberRole);
}
