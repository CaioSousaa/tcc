import { AppDataSource } from "../data-source";
import {
  BoardMember,
  type BoardMemberRole,
  type BoardMemberStatus,
} from "../entities/BoardMember";
import { CardAssignee } from "../entities/CardAssignee";
import { User } from "../entities/User";
import type {
  InviteBoardMemberInput,
  UpdateBoardMemberRoleInput,
} from "../schemas/board-member.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicBoardMember {
  /** "owner" for the board creator's synthetic row, otherwise the membership row id. */
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  role: BoardMemberRole;
  status: BoardMemberStatus;
  isOwner: boolean;
}

export class BoardMemberService {
  private get members() {
    return AppDataSource.getRepository(BoardMember);
  }

  private get users() {
    return AppDataSource.getRepository(User);
  }

  async list(userId: string, boardId: string): Promise<PublicBoardMember[]> {
    const { board } = await boardService.getAccessibleBoard(userId, boardId);

    const owner = await this.users.findOne({ where: { id: board.ownerId } });
    const rows = await this.members.find({
      where: { boardId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });

    const ownerEntry: PublicBoardMember = {
      id: "owner",
      userId: board.ownerId,
      name: owner?.name ?? null,
      email: owner?.email ?? "",
      role: "admin",
      status: "active",
      isOwner: true,
    };

    return [
      ownerEntry,
      ...rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        name: row.user?.name ?? null,
        email: row.user?.email ?? row.email,
        role: row.role,
        status: row.status,
        isOwner: false,
      })),
    ];
  }

  async invite(
    userId: string,
    boardId: string,
    input: InviteBoardMemberInput,
  ): Promise<PublicBoardMember> {
    const board = await boardService.requireAdmin(userId, boardId);

    const owner = await this.users.findOne({ where: { id: board.ownerId } });

    if (owner?.email === input.email) {
      throw new AppError(
        "O criador do quadro já é administrador.",
        422,
        { email: "O criador do quadro já é administrador." },
      );
    }

    const existing = await this.members.findOne({
      where: { boardId, email: input.email },
    });

    if (existing) {
      throw new AppError("Este e-mail já foi convidado.", 409, {
        email: "Este e-mail já foi convidado.",
      });
    }

    const invitedUser = await this.users.findOne({
      where: { email: input.email },
    });

    const member = this.members.create({
      boardId,
      userId: invitedUser?.id ?? null,
      email: input.email,
      role: input.role,
      status: invitedUser ? "active" : "pending",
    });

    await this.members.save(member);

    return {
      id: member.id,
      userId: member.userId,
      name: invitedUser?.name ?? null,
      email: member.email,
      role: member.role,
      status: member.status,
      isOwner: false,
    };
  }

  async updateRole(
    userId: string,
    boardId: string,
    memberId: string,
    input: UpdateBoardMemberRoleInput,
  ): Promise<PublicBoardMember> {
    await boardService.requireAdmin(userId, boardId);

    const member = await this.getBoardMember(boardId, memberId);

    member.role = input.role;
    await this.members.save(member);

    const linkedUser = member.userId
      ? await this.users.findOne({ where: { id: member.userId } })
      : null;

    return {
      id: member.id,
      userId: member.userId,
      name: linkedUser?.name ?? null,
      email: member.email,
      role: member.role,
      status: member.status,
      isOwner: false,
    };
  }

  async remove(
    userId: string,
    boardId: string,
    memberId: string,
  ): Promise<void> {
    await boardService.requireAdmin(userId, boardId);

    const member = await this.getBoardMember(boardId, memberId);

    await AppDataSource.transaction(async (manager) => {
      if (member.userId) {
        // Drop this member's card assignments on the board, so no card keeps
        // showing someone who no longer has access to it.
        await manager
          .createQueryBuilder()
          .delete()
          .from(CardAssignee)
          .where("user_id = :memberUserId", { memberUserId: member.userId })
          .andWhere(
            `card_id IN (
              SELECT card.id FROM cards card
              INNER JOIN lists list ON list.id = card.list_id
              WHERE list.board_id = :boardId
            )`,
            { boardId },
          )
          .execute();
      }

      await manager.remove(member);
    });
  }

  /** Links every pending invite for this e-mail so it becomes an active membership. */
  async activatePendingInvites(userId: string, email: string): Promise<void> {
    await this.members.update(
      { email, status: "pending" },
      { userId, status: "active" },
    );
  }

  private async getBoardMember(
    boardId: string,
    memberId: string,
  ): Promise<BoardMember> {
    const member = await this.members.findOne({ where: { id: memberId } });

    if (!member || member.boardId !== boardId) {
      throw new AppError("Membro não encontrado.", 404);
    }

    return member;
  }
}

export const boardMemberService = new BoardMemberService();
