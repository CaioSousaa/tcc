import { Repository } from "typeorm";
import { Card } from "../entities/card.entity";
import { CardRepository, CreateCardData, UpdateCardFields } from "./repository.types";

export class TypeOrmCardRepository implements CardRepository {
  constructor(private readonly repo: Repository<Card>) {}

  async findAllByList(listId: string): Promise<Card[]> {
    return this.repo.find({ where: { listId }, order: { position: "ASC" } });
  }

  async findByIdAndList(id: string, listId: string): Promise<Card | null> {
    return this.repo.findOne({ where: { id, listId } });
  }

  async create(data: CreateCardData): Promise<Card> {
    return this.repo.manager.transaction(async (manager) => {
      const cardRepo = manager.getRepository(Card);
      const total = await cardRepo.count({ where: { listId: data.listId } });
      const card = cardRepo.create({
        title: data.title,
        description: data.description ?? null,
        dueDate: data.dueDate ?? null,
        listId: data.listId,
        position: total,
      });
      return cardRepo.save(card);
    });
  }

  async update(id: string, listId: string, data: UpdateCardFields): Promise<Card | null> {
    if (Object.keys(data).length === 0) {
      return this.repo.findOne({ where: { id, listId } });
    }

    const result = await this.repo.update({ id, listId }, data);
    if (!result.affected) {
      return null;
    }
    return this.repo.findOne({ where: { id, listId } });
  }

  async move(
    id: string,
    fromListId: string,
    toListId: string,
    data: UpdateCardFields,
  ): Promise<Card | null> {
    return this.repo.manager.transaction(async (manager) => {
      const cardRepo = manager.getRepository(Card);
      const current = await cardRepo.findOne({ where: { id, listId: fromListId } });
      if (!current) {
        return null;
      }

      if (data.title !== undefined) {
        current.title = data.title;
      }
      if (data.description !== undefined) {
        current.description = data.description;
      }
      if (data.dueDate !== undefined) {
        current.dueDate = data.dueDate;
      }

      const remainingInSource = await cardRepo.find({
        where: { listId: fromListId },
        order: { position: "ASC" },
      });
      for (const [index, item] of remainingInSource.filter((c) => c.id !== id).entries()) {
        if (item.position !== index) {
          item.position = index;
          await cardRepo.save(item);
        }
      }

      const totalInTarget = await cardRepo.count({ where: { listId: toListId } });
      current.listId = toListId;
      current.position = totalInTarget;

      return cardRepo.save(current);
    });
  }

  async delete(id: string, listId: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      const cardRepo = manager.getRepository(Card);
      const result = await cardRepo.delete({ id, listId });
      if (!result.affected) {
        return false;
      }

      const remaining = await cardRepo.find({ where: { listId }, order: { position: "ASC" } });
      for (const [index, item] of remaining.entries()) {
        if (item.position !== index) {
          item.position = index;
          await cardRepo.save(item);
        }
      }

      return true;
    });
  }

  async deleteAllByList(listId: string): Promise<number> {
    const result = await this.repo.delete({ listId });
    return result.affected ?? 0;
  }
}
