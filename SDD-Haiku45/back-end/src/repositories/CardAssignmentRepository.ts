import { Repository, In } from "typeorm";
import { CardAssignment } from "../entities/CardAssignment";
import { AppDataSource } from "../database";

export class CardAssignmentRepository {
  private repo: Repository<CardAssignment>;

  constructor() {
    this.repo = AppDataSource.getRepository(CardAssignment);
  }

  async insert(assignment: Partial<CardAssignment>): Promise<CardAssignment> {
    const newAssignment = this.repo.create(assignment);
    return this.repo.save(newAssignment);
  }

  async findByCardId(cardId: string): Promise<CardAssignment[]> {
    return this.repo.find({
      where: { card_id: cardId },
      relations: { board_member: { user: true } },
      order: { assigned_at: "ASC" },
    });
  }

  async findByCardIds(cardIds: string[]): Promise<CardAssignment[]> {
    if (cardIds.length === 0) return [];
    return this.repo.find({
      where: { card_id: In(cardIds) },
      relations: { board_member: { user: true } },
      order: { assigned_at: "ASC" },
    });
  }

  async findById(assignmentId: string): Promise<CardAssignment | null> {
    return this.repo.findOne({
      where: { id: assignmentId },
      relations: { card: true, board_member: { user: true } },
    });
  }

  async findByCardAndMember(
    cardId: string,
    boardMemberId: string
  ): Promise<CardAssignment | null> {
    return this.repo.findOne({
      where: { card_id: cardId, board_member_id: boardMemberId },
      relations: { board_member: true },
    });
  }

  async delete(assignmentId: string): Promise<void> {
    await this.repo.delete({ id: assignmentId });
  }

  async deleteByCardAndMember(
    cardId: string,
    boardMemberId: string
  ): Promise<void> {
    await this.repo.delete({
      card_id: cardId,
      board_member_id: boardMemberId,
    });
  }

  async deleteByBoardMemberId(boardMemberId: string): Promise<void> {
    await this.repo.delete({ board_member_id: boardMemberId });
  }

  async deleteByCardId(cardId: string): Promise<void> {
    await this.repo.delete({ card_id: cardId });
  }

  async countByCard(cardId: string): Promise<number> {
    return this.repo.count({ where: { card_id: cardId } });
  }

  async findByBoardMemberId(boardMemberId: string): Promise<CardAssignment[]> {
    return this.repo.find({
      where: { board_member_id: boardMemberId },
      relations: { card: true },
      order: { assigned_at: "DESC" },
    });
  }
}
