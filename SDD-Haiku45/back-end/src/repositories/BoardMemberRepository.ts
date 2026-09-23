import { Repository } from "typeorm";
import { BoardMember, MemberStatus, MemberRole } from "../entities/BoardMember";
import { AppDataSource } from "../database";

export class BoardMemberRepository {
  private repo: Repository<BoardMember>;

  constructor() {
    this.repo = AppDataSource.getRepository(BoardMember);
  }

  async insert(member: Partial<BoardMember>): Promise<BoardMember> {
    const newMember = this.repo.create(member);
    return this.repo.save(newMember);
  }

  async findByBoardId(boardId: string): Promise<BoardMember[]> {
    return this.repo.find({
      where: { board_id: boardId },
      relations: { user: true },
      order: { created_at: "ASC" },
    });
  }

  async findByBoardIdAndRole(
    boardId: string,
    role: MemberRole
  ): Promise<BoardMember[]> {
    return this.repo.find({
      where: { board_id: boardId, role },
      relations: { user: true },
    });
  }

  async findById(memberId: string, boardId: string): Promise<BoardMember | null> {
    return this.repo.findOne({
      where: { id: memberId, board_id: boardId },
      relations: { user: true },
    });
  }

  async findByUserAndBoard(
    userId: string,
    boardId: string
  ): Promise<BoardMember | null> {
    return this.repo.findOne({
      where: { user_id: userId, board_id: boardId },
      relations: { user: true },
    });
  }

  async update(
    memberId: string,
    boardId: string,
    data: Partial<BoardMember>
  ): Promise<void> {
    await this.repo.update(
      { id: memberId, board_id: boardId },
      data
    );
  }

  async delete(memberId: string, boardId: string): Promise<void> {
    await this.repo.delete({ id: memberId, board_id: boardId });
  }

  async findAdminCount(boardId: string): Promise<number> {
    return this.repo.count({
      where: { board_id: boardId, role: MemberRole.ADMIN, status: MemberStatus.ACTIVE },
    });
  }

  async findActiveMembers(boardId: string): Promise<BoardMember[]> {
    return this.repo.find({
      where: { board_id: boardId, status: MemberStatus.ACTIVE },
      relations: { user: true },
      order: { created_at: "ASC" },
    });
  }

  async findByBoardIdWithStatus(
    boardId: string,
    status: MemberStatus
  ): Promise<BoardMember[]> {
    return this.repo.find({
      where: { board_id: boardId, status },
      relations: { user: true },
    });
  }
}
