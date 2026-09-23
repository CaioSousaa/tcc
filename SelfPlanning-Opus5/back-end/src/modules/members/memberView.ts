import { BoardMember } from "./entities/BoardMember";
import { MemberRole, MemberStatus } from "./memberRoles";

export interface MemberView {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  role: MemberRole;
  status: MemberStatus;
}

export interface AssigneeView {
  memberId: string;
  name: string | null;
  email: string;
}

export function toMemberView(member: BoardMember): MemberView {
  return {
    id: member.id,
    userId: member.userId,
    name: member.user?.name ?? null,
    email: member.email,
    role: member.role,
    status: member.status,
  };
}

export function toAssigneeView(member: BoardMember): AssigneeView {
  return {
    memberId: member.id,
    name: member.user?.name ?? null,
    email: member.email,
  };
}
