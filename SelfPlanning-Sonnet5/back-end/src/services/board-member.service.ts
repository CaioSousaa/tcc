import { AppDataSource } from "../config/data-source";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { User } from "../entities/User";
import { findBoardById } from "./board.service";

const memberRepository = () => AppDataSource.getRepository(BoardMember);
const userRepository = () => AppDataSource.getRepository(User);

export class NotBoardMemberError extends Error {}
export class ForbiddenRoleError extends Error {}
export class InviteeNotFoundError extends Error {}
export class AlreadyMemberError extends Error {}
export class LastAdminError extends Error {}
export class BoardMemberNotFoundError extends Error {}

export async function requireMember(boardId: string, userId: string): Promise<BoardMember> {
  const member = await memberRepository().findOne({ where: { boardId, userId } });
  if (!member) {
    throw new NotBoardMemberError();
  }
  return member;
}

export async function requireAdmin(boardId: string, userId: string): Promise<BoardMember> {
  const member = await requireMember(boardId, userId);
  if (member.role !== "admin") {
    throw new ForbiddenRoleError();
  }
  return member;
}

export async function addMember(
  boardId: string,
  userId: string,
  role: BoardRole
): Promise<BoardMember> {
  const member = memberRepository().create({ boardId, userId, role });
  return memberRepository().save(member);
}

export async function inviteMember(
  requesterId: string,
  boardId: string,
  email: string,
  role: BoardRole
): Promise<BoardMember> {
  await findBoardById(boardId);
  await requireAdmin(boardId, requesterId);

  const invitee = await userRepository().findOne({ where: { email } });
  if (!invitee) {
    throw new InviteeNotFoundError();
  }

  const existing = await memberRepository().findOne({
    where: { boardId, userId: invitee.id },
  });
  if (existing) {
    throw new AlreadyMemberError();
  }

  return addMember(boardId, invitee.id, role);
}

export async function getMemberWithUser(boardId: string, memberId: string): Promise<BoardMember> {
  const member = await memberRepository().findOne({
    where: { id: memberId, boardId },
    relations: { user: true },
  });
  if (!member) {
    throw new BoardMemberNotFoundError();
  }
  return member;
}

export async function listMembers(
  requesterId: string,
  boardId: string
): Promise<BoardMember[]> {
  await findBoardById(boardId);
  await requireMember(boardId, requesterId);

  return memberRepository().find({
    where: { boardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });
}

async function countAdmins(boardId: string): Promise<number> {
  return memberRepository().count({ where: { boardId, role: "admin" } });
}

export async function changeMemberRole(
  requesterId: string,
  boardId: string,
  memberId: string,
  role: BoardRole
): Promise<BoardMember> {
  await findBoardById(boardId);
  await requireAdmin(boardId, requesterId);

  const member = await memberRepository().findOne({ where: { id: memberId, boardId } });
  if (!member) {
    throw new BoardMemberNotFoundError();
  }

  if (member.role === "admin" && role === "member") {
    const adminCount = await countAdmins(boardId);
    if (adminCount <= 1) {
      throw new LastAdminError();
    }
  }

  member.role = role;
  return memberRepository().save(member);
}

export async function removeMember(
  requesterId: string,
  boardId: string,
  memberId: string
): Promise<void> {
  await findBoardById(boardId);
  await requireAdmin(boardId, requesterId);

  const member = await memberRepository().findOne({ where: { id: memberId, boardId } });
  if (!member) {
    throw new BoardMemberNotFoundError();
  }

  if (member.role === "admin") {
    const adminCount = await countAdmins(boardId);
    if (adminCount <= 1) {
      throw new LastAdminError();
    }
  }

  await memberRepository().remove(member);
}
