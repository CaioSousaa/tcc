import { Repository } from "typeorm";
import { CardAssignment } from "../entities/card-assignment.entity";
import { User } from "../../auth/entities/user.entity";
import {
  AssigneeInfo,
  CardAssignmentRepository,
  CreateCardAssignmentData,
} from "./card-assignment.repository.types";

export class TypeOrmCardAssignmentRepository implements CardAssignmentRepository {
  constructor(private readonly repo: Repository<CardAssignment>) {}

  async create(data: CreateCardAssignmentData): Promise<CardAssignment> {
    const existing = await this.repo.findOne({
      where: { cardId: data.cardId, userId: data.userId },
    });
    if (existing) {
      return existing;
    }
    const assignment = this.repo.create(data);
    return this.repo.save(assignment);
  }

  async exists(cardId: string, userId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { cardId, userId } });
    return count > 0;
  }

  async delete(cardId: string, userId: string): Promise<boolean> {
    const result = await this.repo.delete({ cardId, userId });
    return (result.affected ?? 0) > 0;
  }

  async findAllByCardIds(cardIds: string[]): Promise<Record<string, AssigneeInfo[]>> {
    if (cardIds.length === 0) {
      return {};
    }

    const rows = await this.repo
      .createQueryBuilder("assignment")
      .innerJoin(User, "user", "user.id = assignment.user_id")
      .select("assignment.card_id", "cardId")
      .addSelect("user.id", "userId")
      .addSelect("user.name", "name")
      .addSelect("user.email", "email")
      .where("assignment.card_id IN (:...cardIds)", { cardIds })
      .orderBy("assignment.created_at", "ASC")
      .getRawMany<{ cardId: string; userId: string; name: string; email: string }>();

    const result: Record<string, AssigneeInfo[]> = {};
    for (const row of rows) {
      const list = result[row.cardId] ?? (result[row.cardId] = []);
      list.push({ userId: row.userId, name: row.name, email: row.email });
    }
    return result;
  }

  async deleteAllByBoardAndUser(boardId: string, userId: string): Promise<number> {
    const result = await this.repo.delete({ boardId, userId });
    return result.affected ?? 0;
  }
}
