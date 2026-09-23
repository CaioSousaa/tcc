import { Checklist } from "../entities/Checklist";
import { ChecklistItem } from "../entities/ChecklistItem";
import { ChecklistRepository } from "../repositories/ChecklistRepository";
import { ChecklistItemRepository } from "../repositories/ChecklistItemRepository";
import { CardRepository } from "../repositories/CardRepository";

export class ChecklistService {
  private checklistRepository: ChecklistRepository;
  private checklistItemRepository: ChecklistItemRepository;
  private cardRepository: CardRepository;

  constructor() {
    this.checklistRepository = new ChecklistRepository();
    this.checklistItemRepository = new ChecklistItemRepository();
    this.cardRepository = new CardRepository();
  }

  async createChecklist(
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<Checklist> {
    const card = await this.cardRepository.findByCardId(cardId);
    if (!card || card.list?.board_id !== boardId) {
      throw new Error("Card not found or does not belong to this board");
    }

    const existing = await this.checklistRepository.findByCardId(cardId);
    if (existing) {
      throw new Error("This card already has a checklist");
    }

    return this.checklistRepository.insert({ card_id: cardId });
  }

  async deleteChecklist(
    boardId: string,
    cardId: string,
    checklistId: string,
    userId: string
  ): Promise<void> {
    const card = await this.cardRepository.findByCardId(cardId);
    if (!card || card.list?.board_id !== boardId) {
      throw new Error("Card not found or does not belong to this board");
    }

    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist || checklist.card_id !== cardId) {
      throw new Error("Checklist not found or does not belong to this card");
    }

    await this.checklistRepository.delete(checklistId);
  }

  async getChecklistWithProgress(
    checklistId: string
  ): Promise<{
    id: string;
    items: ChecklistItem[];
    progress: { completed: number; total: number; percentage: number };
  }> {
    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const completed = await this.checklistItemRepository.countCompleted(
      checklistId
    );
    const total = await this.checklistItemRepository.countAll(checklistId);

    return {
      id: checklist.id,
      items: checklist.items || [],
      progress: {
        completed,
        total,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
      },
    };
  }

  async addItem(
    checklistId: string,
    title: string,
    userId: string
  ): Promise<ChecklistItem> {
    const sanitized = (title || "").trim();

    if (sanitized.length < 1 || sanitized.length > 500) {
      throw new Error("Item title must be between 1 and 500 characters");
    }

    const checklist = await this.checklistRepository.findById(checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    const position = await this.checklistItemRepository.getMaxPosition(
      checklistId
    );

    return this.checklistItemRepository.insert({
      checklist_id: checklistId,
      title: sanitized,
      is_completed: false,
      position,
    });
  }

  async updateItem(
    checklistId: string,
    itemId: string,
    data: { title?: string; is_completed?: boolean },
    userId: string
  ): Promise<ChecklistItem> {
    const item = await this.checklistItemRepository.findById(itemId);
    if (!item || item.checklist_id !== checklistId) {
      throw new Error("Item not found or does not belong to this checklist");
    }

    const updates: Partial<ChecklistItem> = {};

    if (data.title !== undefined) {
      const sanitized = (data.title || "").trim();
      if (sanitized.length < 1 || sanitized.length > 500) {
        throw new Error("Item title must be between 1 and 500 characters");
      }
      updates.title = sanitized;
    }

    if (data.is_completed !== undefined) {
      updates.is_completed = data.is_completed;
    }

    await this.checklistItemRepository.update(itemId, updates);

    const updated = await this.checklistItemRepository.findById(itemId);
    return updated!;
  }

  async removeItem(
    checklistId: string,
    itemId: string,
    userId: string
  ): Promise<void> {
    const item = await this.checklistItemRepository.findById(itemId);
    if (!item || item.checklist_id !== checklistId) {
      throw new Error("Item not found or does not belong to this checklist");
    }

    await this.checklistItemRepository.delete(itemId);
  }

  async getProgress(checklistId: string): Promise<{
    completed: number;
    total: number;
    percentage: number;
  }> {
    const completed = await this.checklistItemRepository.countCompleted(
      checklistId
    );
    const total = await this.checklistItemRepository.countAll(checklistId);

    return {
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }
}
