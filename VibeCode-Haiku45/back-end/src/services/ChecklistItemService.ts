import { Repository } from "typeorm";
import { ChecklistItem } from "../entities/ChecklistItem";
import { Card } from "../entities/Card";

export class ChecklistItemService {
  constructor(
    private checklistItemRepository: Repository<ChecklistItem>,
    private cardRepository: Repository<Card>
  ) {}

  async createChecklistItem(cardId: string, userId: string, title: string): Promise<ChecklistItem> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true } },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    if (!title.trim()) {
      throw new Error("Item title is required");
    }

    const items = await this.checklistItemRepository.find({
      where: { cardId },
      order: { position: "DESC" },
    });
    const nextPosition = items.length > 0 && items[0] ? items[0].position + 1 : 0;

    const item = this.checklistItemRepository.create({
      title,
      cardId,
      position: nextPosition,
      completed: false,
    });

    return this.checklistItemRepository.save(item) as unknown as Promise<ChecklistItem>;
  }

  async getChecklistItems(cardId: string, userId: string): Promise<ChecklistItem[]> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true } },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    return this.checklistItemRepository.find({
      where: { cardId },
      order: { position: "ASC" },
    });
  }

  async updateChecklistItem(itemId: string, userId: string, data: { title?: string; completed?: boolean }): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId },
      relations: { card: { list: { board: true } } },
    });

    if (!item || item.card.list.board.userId !== userId) {
      throw new Error("Item not found");
    }

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw new Error("Item title is required");
      }
      item.title = data.title;
    }

    if (data.completed !== undefined) {
      item.completed = data.completed;
    }

    return this.checklistItemRepository.save(item);
  }

  async deleteChecklistItem(itemId: string, userId: string): Promise<void> {
    const item = await this.checklistItemRepository.findOne({
      where: { id: itemId },
      relations: { card: { list: { board: true } } },
    });

    if (!item || item.card.list.board.userId !== userId) {
      throw new Error("Item not found");
    }

    const allItems = await this.checklistItemRepository.find({
      where: { cardId: item.cardId },
      order: { position: "ASC" },
    });

    for (const i of allItems) {
      if (i.position > item.position) {
        i.position -= 1;
        await this.checklistItemRepository.save(i);
      }
    }

    await this.checklistItemRepository.remove(item);
  }
}
