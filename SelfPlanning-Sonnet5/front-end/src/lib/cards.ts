import { Label } from "./labels";

export interface Card {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
  dueDate: string | null;
  isOverdue?: boolean;
  overdueDays?: number;
  checklist?: { done: number; total: number };
}
