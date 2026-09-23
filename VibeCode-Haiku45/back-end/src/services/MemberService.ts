import { Repository } from "typeorm";
import { BoardMember, BoardRole } from "../entities/BoardMember";
import { Board } from "../entities/Board";
import { User } from "../entities/User";

export class MemberService {
  constructor(
    private memberRepository: Repository<BoardMember>,
    private boardRepository: Repository<Board>,
    private userRepository: Repository<User>
  ) {}

  async addMember(boardId: string, userId: string, userEmail: string, role: BoardRole, adminUserId: string): Promise<BoardMember> {
    const board = await this.boardRepository.findOne({ where: { id: boardId, userId: adminUserId } });
    if (!board) {
      throw new Error("Board not found or you don't have permission");
    }

    let member = await this.userRepository.findOne({ where: { email: userEmail } });
    if (!member) {
      throw new Error("User not found");
    }

    const existing = await this.memberRepository.findOne({
      where: { boardId, userId: member.id },
    });
    if (existing) {
      throw new Error("User is already a member");
    }

    const boardMember = this.memberRepository.create({
      boardId,
      userId: member.id,
      role,
    });

    return this.memberRepository.save(boardMember);
  }

  async getMembers(boardId: string): Promise<BoardMember[]> {
    return this.memberRepository.find({
      where: { boardId },
      relations: { user: true },
    });
  }

  async updateMemberRole(memberId: string, userId: string, role: BoardRole): Promise<BoardMember> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: { board: true },
    });

    if (!member || member.board.userId !== userId) {
      throw new Error("Member not found or you don't have permission");
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  async removeMember(memberId: string, userId: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: { board: true },
    });

    if (!member || member.board.userId !== userId) {
      throw new Error("Member not found or you don't have permission");
    }

    await this.memberRepository.remove(member);
  }
}
