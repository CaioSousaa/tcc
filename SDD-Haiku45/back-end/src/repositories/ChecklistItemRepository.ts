import { Repository } from "typeorm";
import { ChecklistItem } from "../entities/ChecklistItem";
import { AppDataSource } from "../database";

export class ChecklistItemRepository {
  private repo: Repository<ChecklistItem>;

  constructor() {
    this.repo = AppDataSource.getRepository(ChecklistItem);
  }

  async findByChecklistId(checklistId: string): Promise<ChecklistItem[]> {
    return this.repo.find({
      where: { checklist_id: checklistId },
      order: { position: "ASC" },
    });
  }

  async insert(item: Partial<ChecklistItem>): Promise<ChecklistItem> {
    const newItem = this.repo.create(item);
    return this.repo.save(newItem);
  }

  async update(
    itemId: string,
    data: Partial<ChecklistItem>
  ): Promise<void> {
    await this.repo.update({ id: itemId }, data);
  }

  async delete(itemId: string): Promise<void> {
    await this.repo.delete({ id: itemId });
  }

  async countCompleted(checklistId: string): Promise<number> {
    return this.repo.count({
      where: { checklist_id: checklistId, is_completed: true },
    });
  }

  async countAll(checklistId: string): Promise<number> {
    return this.repo.count({ where: { checklist_id: checklistId } });
  }

  async getMaxPosition(checklistId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .select("MAX(position)", "max")
      .where("checklist_id = :checklistId", { checklistId })
      .getRawOne();
    return (result?.max || -1) + 1;
  }

  async findById(itemId: string): Promise<ChecklistItem | null> {
    return this.repo.findOne({ where: { id: itemId } });
  }

  async deleteByChecklistId(checklistId: string): Promise<void> {
    await this.repo.delete({ checklist_id: checklistId });
  }
}
