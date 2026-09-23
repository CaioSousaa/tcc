import { Checklist } from "../entities/checklist.entity";
import { ChecklistItem } from "../entities/checklist-item.entity";

export interface CreateChecklistData {
  cardId: string;
  name: string;
}

export interface CreateItemData {
  checklistId: string;
  text: string;
}

export type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

export interface CardProgress {
  completed: number;
  total: number;
}

export interface ChecklistRepository {
  createChecklist(data: CreateChecklistData): Promise<Checklist>;
  findAllByCardWithItems(cardId: string): Promise<ChecklistWithItems[]>;
  findChecklistByIdAndCard(id: string, cardId: string): Promise<Checklist | null>;
  deleteChecklist(id: string, cardId: string): Promise<boolean>;
  deleteAllByCards(cardIds: string[]): Promise<number>;

  createItem(data: CreateItemData): Promise<ChecklistItem>;
  findItemByIdAndChecklist(id: string, checklistId: string): Promise<ChecklistItem | null>;
  updateItemCompleted(
    id: string,
    checklistId: string,
    completed: boolean,
  ): Promise<ChecklistItem | null>;
  deleteItem(id: string, checklistId: string): Promise<boolean>;

  getProgressByCards(cardIds: string[]): Promise<Record<string, CardProgress>>;
}
