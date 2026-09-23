import { Repository } from "typeorm";
import { CardAssignee } from "../entities/CardAssignee";
import { Card } from "../entities/Card";

export class AssigneeService {
  constructor(
    private assigneeRepository: Repository<CardAssignee>,
    private cardRepository: Repository<Card>
  ) {}

  async assignUser(cardId: string, userId: string, userIdToAssign: string): Promise<CardAssignee> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true } },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    const existing = await this.assigneeRepository.findOne({
      where: { cardId, userId: userIdToAssign },
    });
    if (existing) {
      throw new Error("User already assigned to this card");
    }

    const assignee = this.assigneeRepository.create({
      cardId,
      userId: userIdToAssign,
    });

    return this.assigneeRepository.save(assignee);
  }

  async getAssignees(cardId: string): Promise<CardAssignee[]> {
    return this.assigneeRepository.find({
      where: { cardId },
      relations: { user: true },
    });
  }

  async removeAssignee(assigneeId: string, userId: string): Promise<void> {
    const assignee = await this.assigneeRepository.findOne({
      where: { id: assigneeId },
      relations: { card: { list: { board: true } } },
    });

    if (!assignee || assignee.card.list.board.userId !== userId) {
      throw new Error("Assignee not found");
    }

    await this.assigneeRepository.remove(assignee);
  }
}
