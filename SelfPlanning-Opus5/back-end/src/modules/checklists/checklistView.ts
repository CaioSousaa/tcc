import { ChecklistItem } from "./entities/ChecklistItem";

export interface ChecklistItemView {
  id: string;
  title: string;
  done: boolean;
  position: number;
  cardId: string;
}

export function toChecklistItemView(item: ChecklistItem): ChecklistItemView {
  return {
    id: item.id,
    title: item.title,
    done: item.done,
    position: item.position,
    cardId: item.cardId,
  };
}
