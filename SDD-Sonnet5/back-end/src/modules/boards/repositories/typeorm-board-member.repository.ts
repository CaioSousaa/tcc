import { Repository } from "typeorm";
import { BoardMember, BoardMemberRole } from "../entities/board-member.entity";
import { User } from "../../auth/entities/user.entity";
import {
  BoardMemberRepository,
  CreateBoardMemberData,
  MemberInfo,
} from "./board-member.repository.types";

export class TypeOrmBoardMemberRepository implements BoardMemberRepository {
  constructor(private readonly repo: Repository<BoardMember>) {}

  async create(data: CreateBoardMemberData): Promise<BoardMember> {
    const member = this.repo.create({
      boardId: data.boardId,
      userId: data.userId,
      role: data.role,
    });
    return this.repo.save(member);
  }

  async findAllByBoard(boardId: string): Promise<BoardMember[]> {
    return this.repo.find({ where: { boardId }, order: { createdAt: "ASC" } });
  }

  async findAllByBoardWithUser(boardId: string): Promise<MemberInfo[]> {
    const rows = await this.repo
      .createQueryBuilder("member")
      .innerJoin(User, "user", "user.id = member.user_id")
      .select("user.id", "userId")
      .addSelect("user.name", "name")
      .addSelect("user.email", "email")
      .addSelect("member.role", "role")
      .where("member.board_id = :boardId", { boardId })
      .orderBy("member.created_at", "ASC")
      .getRawMany<MemberInfo>();
    return rows;
  }

  async findByBoardAndUser(boardId: string, userId: string): Promise<BoardMember | null> {
    return this.repo.findOne({ where: { boardId, userId } });
  }

  async findAllByUserId(userId: string): Promise<BoardMember[]> {
    return this.repo.find({ where: { userId } });
  }

  async updateRole(
    boardId: string,
    userId: string,
    role: BoardMemberRole,
  ): Promise<BoardMember | null> {
    const result = await this.repo.update({ boardId, userId }, { role });
    if (!result.affected) {
      return null;
    }
    return this.repo.findOne({ where: { boardId, userId } });
  }

  async delete(boardId: string, userId: string): Promise<boolean> {
    const result = await this.repo.delete({ boardId, userId });
    return (result.affected ?? 0) > 0;
  }

  async countAdminsByBoard(boardId: string): Promise<number> {
    return this.repo.count({ where: { boardId, role: "administrador" } });
  }
}
