import { AppError } from "../../../shared/errors/AppError";
import { requireBoardAccess, requireBoardAdmin } from "../../boards/services/boardService";
import { User } from "../../users/entities/User";
import { userRepository } from "../../users/repositories/userRepository";
import { BoardMember } from "../entities/BoardMember";
import { MemberView, toMemberView } from "../memberView";
import { MemberRole } from "../memberRoles";
import { memberRepository } from "../repositories/memberRepository";

export interface InviteMemberRequest {
  boardId: string;
  actorId: string;
  email: string;
  role: MemberRole;
}

export interface UpdateRoleRequest {
  boardId: string;
  actorId: string;
  memberId: string;
  role: MemberRole;
}

export interface RemoveMemberRequest {
  boardId: string;
  actorId: string;
  memberId: string;
}

async function membersOf(boardId: string): Promise<MemberView[]> {
  const members = await memberRepository().find({
    where: { boardId },
    relations: { user: true },
    order: { createdAt: "ASC" },
  });

  return members.map(toMemberView);
}

async function findMemberOfBoard(memberId: string, boardId: string): Promise<BoardMember> {
  const member = await memberRepository().findOne({ where: { id: memberId } });

  if (!member || member.boardId !== boardId) {
    throw new AppError("Membro não encontrado", 404);
  }

  return member;
}

export async function inviteMember(data: InviteMemberRequest): Promise<MemberView[]> {
  await requireBoardAdmin(data.boardId, data.actorId);

  const repository = memberRepository();

  const alreadyInvited = await repository.findOne({
    where: { boardId: data.boardId, email: data.email },
  });

  if (alreadyInvited) {
    throw new AppError("Este e-mail já faz parte do quadro", 409);
  }

  const user = await userRepository().findOne({ where: { email: data.email } });

  await repository.save(
    repository.create({
      boardId: data.boardId,
      userId: user?.id ?? null,
      email: data.email,
      role: data.role,
      status: user ? "active" : "pending",
    })
  );

  return membersOf(data.boardId);
}

export async function listMembers(boardId: string, userId: string): Promise<MemberView[]> {
  await requireBoardAccess(boardId, userId);

  return membersOf(boardId);
}

export async function updateMemberRole(data: UpdateRoleRequest): Promise<MemberView[]> {
  const board = await requireBoardAdmin(data.boardId, data.actorId);

  const member = await findMemberOfBoard(data.memberId, data.boardId);

  if (member.userId === board.ownerId) {
    throw new AppError("O papel do proprietário do quadro não pode ser alterado", 403);
  }

  member.role = data.role;

  await memberRepository().save(member);

  return membersOf(data.boardId);
}

export async function removeMember(data: RemoveMemberRequest): Promise<MemberView[]> {
  const board = await requireBoardAdmin(data.boardId, data.actorId);

  const member = await findMemberOfBoard(data.memberId, data.boardId);

  if (member.userId === board.ownerId) {
    throw new AppError("O proprietário do quadro não pode ser removido", 403);
  }

  await memberRepository().remove(member);

  return membersOf(data.boardId);
}

/** Liga ao novo usuário todo convite pendente feito para o e-mail dele. */
export async function activatePendingInvites(user: User): Promise<void> {
  const repository = memberRepository();

  const pending = await repository.find({
    where: { email: user.email, status: "pending" },
  });

  if (pending.length === 0) {
    return;
  }

  await repository.save(
    pending.map((member) => {
      member.userId = user.id;
      member.status = "active";

      return member;
    })
  );
}
