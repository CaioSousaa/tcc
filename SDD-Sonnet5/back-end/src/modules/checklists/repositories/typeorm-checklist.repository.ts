import { In, Repository } from "typeorm";
import { Checklist } from "../entities/checklist.entity";
import { ChecklistItem } from "../entities/checklist-item.entity";
import {
  CardProgress,
  ChecklistRepository,
  ChecklistWithItems,
  CreateChecklistData,
  CreateItemData,
} from "./repository.types";

export class TypeOrmChecklistRepository implements ChecklistRepository {
  constructor(
    private readonly checklistRepo: Repository<Checklist>,
    private readonly itemRepo: Repository<ChecklistItem>,
  ) {}

  async createChecklist(data: CreateChecklistData): Promise<Checklist> {
    const checklist = this.checklistRepo.create({ name: data.name, cardId: data.cardId });
    return this.checklistRepo.save(checklist);
  }

  async findAllByCardWithItems(cardId: string): Promise<ChecklistWithItems[]> {
    const checklists = await this.checklistRepo.find({
      where: { cardId },
      order: { createdAt: "ASC" },
    });
    if (checklists.length === 0) {
      return [];
    }

    const items = await this.itemRepo.find({
      where: { checklistId: In(checklists.map((c) => c.id)) },
      order: { createdAt: "ASC" },
    });

    return checklists.map((checklist) => ({
      ...checklist,
      items: items.filter((item) => item.checklistId === checklist.id),
    }));
  }

  async findChecklistByIdAndCard(id: string, cardId: string): Promise<Checklist | null> {
    return this.checklistRepo.findOne({ where: { id, cardId } });
  }

  async deleteChecklist(id: string, cardId: string): Promise<boolean> {
    return this.checklistRepo.manager.transaction(async (manager) => {
      const checklistRepo = manager.getRepository(Checklist);
      const itemRepo = manager.getRepository(ChecklistItem);

      const checklist = await checklistRepo.findOne({ where: { id, cardId } });
      if (!checklist) {
        return false;
      }

      await itemRepo.delete({ checklistId: id });
      await checklistRepo.delete({ id, cardId });
      return true;
    });
  }

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    if (cardIds.length === 0) {
      return 0;
    }

    return this.checklistRepo.manager.transaction(async (manager) => {
      const checklistRepo = manager.getRepository(Checklist);
      const itemRepo = manager.getRepository(ChecklistItem);

      const checklists = await checklistRepo.find({ where: { cardId: In(cardIds) } });
      if (checklists.length === 0) {
        return 0;
      }

      const checklistIds = checklists.map((c) => c.id);
      await itemRepo.delete({ checklistId: In(checklistIds) });
      const result = await checklistRepo.delete({ id: In(checklistIds) });
      return result.affected ?? 0;
    });
  }

  async createItem(data: CreateItemData): Promise<ChecklistItem> {
    const item = this.itemRepo.create({
      text: data.text,
      checklistId: data.checklistId,
      completed: false,
    });
    return this.itemRepo.save(item);
  }

  async findItemByIdAndChecklist(id: string, checklistId: string): Promise<ChecklistItem | null> {
    return this.itemRepo.findOne({ where: { id, checklistId } });
  }

  async updateItemCompleted(
    id: string,
    checklistId: string,
    completed: boolean,
  ): Promise<ChecklistItem | null> {
    const result = await this.itemRepo.update({ id, checklistId }, { completed });
    if (!result.affected) {
      return null;
    }
    return this.itemRepo.findOne({ where: { id, checklistId } });
  }

  async deleteItem(id: string, checklistId: string): Promise<boolean> {
    const result = await this.itemRepo.delete({ id, checklistId });
    return (result.affected ?? 0) > 0;
  }

  async getProgressByCards(cardIds: string[]): Promise<Record<string, CardProgress>> {
    if (cardIds.length === 0) {
      return {};
    }

    const rows = await this.itemRepo
      .createQueryBuilder("item")
      .innerJoin("item.checklist", "checklist")
      .select("checklist.cardId", "cardId")
      .addSelect("COUNT(*)", "total")
      .addSelect("SUM(CASE WHEN item.completed THEN 1 ELSE 0 END)", "completed")
      .where("checklist.cardId IN (:...cardIds)", { cardIds })
      .groupBy("checklist.cardId")
      .getRawMany<{ cardId: string; total: string; completed: string }>();

    const progress: Record<string, CardProgress> = {};
    for (const row of rows) {
      progress[row.cardId] = { total: Number(row.total), completed: Number(row.completed) };
    }
    return progress;
  }
}
