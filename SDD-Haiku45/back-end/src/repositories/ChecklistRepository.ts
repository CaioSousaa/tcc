import { Repository, In } from "typeorm";
import { Checklist } from "../entities/Checklist";
import { AppDataSource } from "../database";

export class ChecklistRepository {
  private repo: Repository<Checklist>;

  constructor() {
    this.repo = AppDataSource.getRepository(Checklist);
  }

  async findByCardIds(cardIds: string[]): Promise<Checklist[]> {
    if (cardIds.length === 0) return [];
    return this.repo.find({
      where: { card_id: In(cardIds) },
      relations: { items: true },
    });
  }

  async findByCardId(cardId: string): Promise<Checklist | null> {
    return this.repo.findOne({
      where: { card_id: cardId },
      relations: { items: true },
    });
  }

  async insert(checklist: Partial<Checklist>): Promise<Checklist> {
    const newChecklist = this.repo.create(checklist);
    return this.repo.save(newChecklist);
  }

  async delete(checklistId: string): Promise<void> {
    await this.repo.delete({ id: checklistId });
  }

  async findById(checklistId: string): Promise<Checklist | null> {
    return this.repo.findOne({
      where: { id: checklistId },
      relations: { items: true },
    });
  }
}
