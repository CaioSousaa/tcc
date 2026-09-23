import { BoardNotFoundError } from "./boards.errors";
import {
  ForbiddenRoleError,
  LastAdministratorError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
  UserNotFoundError,
} from "./boards-members.errors";
import { InviteMemberInput, UpdateMemberRoleInput } from "./boards-members.schemas";
import { BoardMember, BoardMemberRole } from "./entities/board-member.entity";
import { BoardMemberRepository, MemberInfo } from "./repositories/board-member.repository.types";
import { UserRepository } from "../auth/repositories/repository.types";
import { CardAssignmentRepository } from "../cards/repositories/card-assignment.repository.types";

export interface InvitedMember {
  userId: string;
  name: string;
  email: string;
  role: BoardMemberRole;
  boardId: string;
}

export class BoardsMembersService {
  constructor(
    private readonly boardMemberRepository: BoardMemberRepository,
    private readonly userRepository: UserRepository,
    private readonly cardAssignmentRepository: CardAssignmentRepository,
  ) {}

  async invite(actorId: string, boardId: string, input: InviteMemberInput): Promise<InvitedMember> {
    await this.assertAdmin(actorId, boardId);

    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    const existing = await this.boardMemberRepository.findByBoardAndUser(boardId, user.id);
    if (existing) {
      throw new MemberAlreadyExistsError();
    }

    await this.boardMemberRepository.create({ boardId, userId: user.id, role: input.role });

    return { userId: user.id, name: user.name, email: user.email, role: input.role, boardId };
  }

  async list(actorId: string, boardId: string): Promise<MemberInfo[]> {
    await this.assertMember(actorId, boardId);
    return this.boardMemberRepository.findAllByBoardWithUser(boardId);
  }

  async updateRole(
    actorId: string,
    boardId: string,
    targetUserId: string,
    input: UpdateMemberRoleInput,
  ): Promise<BoardMember> {
    await this.assertAdmin(actorId, boardId);

    const target = await this.boardMemberRepository.findByBoardAndUser(boardId, targetUserId);
    if (!target) {
      throw new MemberNotFoundError();
    }

    const isDemotingLastAdmin = target.role === "administrador" && input.role !== "administrador";
    if (isDemotingLastAdmin) {
      await this.assertNotLastAdministrator(boardId);
    }

    const updated = await this.boardMemberRepository.updateRole(boardId, targetUserId, input.role);
    if (!updated) {
      throw new MemberNotFoundError();
    }
    return updated;
  }

  async remove(actorId: string, boardId: string, targetUserId: string): Promise<void> {
    await this.assertAdmin(actorId, boardId);
    await this.removeMembership(boardId, targetUserId);
  }

  async leave(actorId: string, boardId: string): Promise<void> {
    await this.assertMember(actorId, boardId);
    await this.removeMembership(boardId, actorId);
  }

  private async removeMembership(boardId: string, targetUserId: string): Promise<void> {
    const target = await this.boardMemberRepository.findByBoardAndUser(boardId, targetUserId);
    if (!target) {
      throw new MemberNotFoundError();
    }

    if (target.role === "administrador") {
      await this.assertNotLastAdministrator(boardId);
    }

    const deleted = await this.boardMemberRepository.delete(boardId, targetUserId);
    if (!deleted) {
      throw new MemberNotFoundError();
    }

    await this.cardAssignmentRepository.deleteAllByBoardAndUser(boardId, targetUserId);
  }

  private async assertNotLastAdministrator(boardId: string): Promise<void> {
    const adminCount = await this.boardMemberRepository.countAdminsByBoard(boardId);
    if (adminCount <= 1) {
      throw new LastAdministratorError();
    }
  }

  private async assertMember(actorId: string, boardId: string): Promise<BoardMember> {
    const membership = await this.boardMemberRepository.findByBoardAndUser(boardId, actorId);
    if (!membership) {
      throw new BoardNotFoundError();
    }
    return membership;
  }

  private async assertAdmin(actorId: string, boardId: string): Promise<void> {
    const membership = await this.assertMember(actorId, boardId);
    if (membership.role !== "administrador") {
      throw new ForbiddenRoleError();
    }
  }
}
