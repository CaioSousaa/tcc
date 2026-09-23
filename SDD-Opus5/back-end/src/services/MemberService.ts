import { randomUUID } from "node:crypto";
import { BOARD_PEOPLE_MAX, type MembersState } from "../domain/members";
import { assertCan, type BoardRole } from "../domain/permissions";
import { AppError, UniqueConstraintError } from "../errors/AppError";
import type { MemberRecord, MemberRepository, MemberTransaction } from "../repositories/MemberRepository";
import { isUuid } from "../schemas/board.schemas";
import type { InviteInput, RoleInput } from "../schemas/member.schemas";
import { boardScopeFor } from "./boardAccess";

export type LeaveResult = { left: true };
export type RemoveMemberResult = MembersState | LeaveResult;

/**
 * Participants and invitations of a board (RF07 plan 2.4). Every write runs under
 * the board lock with the role read there (F81, F82), and answers with the full
 * state of the window (C164). Order: participation, permission, resources, state (C148).
 */
export class MemberService {
  constructor(private readonly repository: MemberRepository) {}

  private async inBoard<T>(
    userId: string,
    boardId: string,
    work: (tx: MemberTransaction, role: BoardRole) => Promise<T>,
  ): Promise<T> {
    const result = await this.repository.withBoardLock(boardScopeFor(userId), boardId, work);
    if (!result.found) throw new AppError("BOARD_NOT_FOUND");
    return result.value;
  }

  private static async state(tx: MemberTransaction, userId: string): Promise<MembersState> {
    const members = await tx.listMembers();
    const me = members.find((member) => member.userId === userId);
    if (!me) throw new Error("Current account missing from the board it acted on");
    return { myRole: me.role, members, invitations: await tx.listInvitations() };
  }

  /** A malformed id is "not found" like a participant of another board (CB05, CB06). */
  private static async requireMember(tx: MemberTransaction, targetUserId: string): Promise<MemberRecord> {
    if (!isUuid(targetUserId)) throw new AppError("MEMBER_NOT_FOUND");
    const member = await tx.findMember(targetUserId);
    if (!member) throw new AppError("MEMBER_NOT_FOUND");
    return member;
  }

  private static async requireInvitation(tx: MemberTransaction, invitationId: string): Promise<void> {
    if (!isUuid(invitationId) || !(await tx.findInvitation(invitationId))) throw new AppError("INVITATION_NOT_FOUND");
  }

  /** RN04: the only administrator can neither become a member nor leave. */
  private static async assertNotLastAdmin(tx: MemberTransaction, target: MemberRecord): Promise<void> {
    if (target.role === "admin" && (await tx.countAdmins()) <= 1) throw new AppError("LAST_ADMIN");
  }

  /** Any participant sees the people of the board (RN05). */
  async get(userId: string, boardId: string): Promise<MembersState> {
    const state = await this.repository.findState(boardScopeFor(userId), boardId);
    if (!state) throw new AppError("BOARD_NOT_FOUND");
    return state;
  }

  /** RN07, RN12, CB08, CB11. */
  invite(userId: string, boardId: string, input: InviteInput): Promise<MembersState> {
    return this.inBoard(userId, boardId, async (tx, role) => {
      assertCan(role, "members.manage");
      if (await tx.isMemberEmail(input.email)) throw new AppError("ALREADY_MEMBER");
      if (await tx.findInvitationByEmail(input.email)) throw new AppError("INVITATION_ALREADY_PENDING");
      if ((await tx.countPeople()) >= BOARD_PEOPLE_MAX) throw new AppError("MEMBER_LIMIT_REACHED");

      try {
        await tx.insertInvitation({ id: randomUUID(), email: input.email, role: input.role, invitedBy: userId });
      } catch (error) {
        // The unique constraint is the last barrier against simultaneous invitations (F87).
        if (error instanceof UniqueConstraintError) throw new AppError("INVITATION_ALREADY_PENDING");
        throw error;
      }
      return MemberService.state(tx, userId);
    });
  }

  updateInvitation(userId: string, boardId: string, invitationId: string, input: RoleInput): Promise<MembersState> {
    return this.inBoard(userId, boardId, async (tx, role) => {
      assertCan(role, "members.manage");
      await MemberService.requireInvitation(tx, invitationId);
      await tx.updateInvitationRole(invitationId, input.role);
      return MemberService.state(tx, userId);
    });
  }

  cancelInvitation(userId: string, boardId: string, invitationId: string): Promise<MembersState> {
    return this.inBoard(userId, boardId, async (tx, role) => {
      assertCan(role, "members.manage");
      await MemberService.requireInvitation(tx, invitationId);
      await tx.deleteInvitation(invitationId);
      return MemberService.state(tx, userId);
    });
  }

  /** Same value is accepted without change (CB07); the last administrator is protected (RN04). */
  updateMember(userId: string, boardId: string, targetUserId: string, input: RoleInput): Promise<MembersState> {
    return this.inBoard(userId, boardId, async (tx, role) => {
      assertCan(role, "members.manage");
      const target = await MemberService.requireMember(tx, targetUserId);
      if (target.role !== input.role) {
        if (input.role === "member") await MemberService.assertNotLastAdmin(tx, target);
        await tx.updateMemberRole(target.userId, input.role);
      }
      return MemberService.state(tx, userId);
    });
  }

  /**
   * Removing oneself is leaving (A53, C157). Assignments go with the participation
   * through the composite foreign key, in the same transaction (F83, RN10).
   */
  removeMember(userId: string, boardId: string, targetUserId: string): Promise<RemoveMemberResult> {
    return this.inBoard(userId, boardId, async (tx, role): Promise<RemoveMemberResult> => {
      const leaving = targetUserId === userId;
      assertCan(role, leaving ? "members.leave" : "members.manage");

      const target = await MemberService.requireMember(tx, targetUserId);
      await MemberService.assertNotLastAdmin(tx, target);
      await tx.deleteMember(target.userId);

      if (leaving) return { left: true };
      return MemberService.state(tx, userId);
    });
  }
}
