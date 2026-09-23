import { Card } from "./entities/Card";
import { AssigneeView } from "../members/memberView";
import { LabelView } from "../labels/labelView";

export type DueStatus = "overdue" | "today" | "upcoming";

/** Data de hoje no formato AAAA-MM-DD, para comparar com o prazo sem hora. */
export function todayAsIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function dueStatusOf(dueDate: string | null): DueStatus | null {
  if (dueDate === null) {
    return null;
  }

  const today = todayAsIsoDate();

  if (dueDate < today) {
    return "overdue";
  }

  return dueDate === today ? "today" : "upcoming";
}

export interface ChecklistProgress {
  checklistTotal: number;
  checklistDone: number;
}

export interface CardView extends ChecklistProgress {
  assignees: AssigneeView[];
  labels: LabelView[];
  commentCount: number;
  dueStatus: DueStatus | null;
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  position: number;
  listId: string;
}

export const EMPTY_CHECKLIST_PROGRESS: ChecklistProgress = {
  checklistTotal: 0,
  checklistDone: 0,
};

export type CardsByList = Record<string, CardView[]>;

export function toCardView(
  card: Card,
  progress: ChecklistProgress = EMPTY_CHECKLIST_PROGRESS,
  assignees: AssigneeView[] = [],
  labels: LabelView[] = [],
  commentCount = 0
): CardView {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    position: card.position,
    listId: card.listId,
    checklistTotal: progress.checklistTotal,
    checklistDone: progress.checklistDone,
    assignees,
    labels,
    commentCount,
    dueStatus: dueStatusOf(card.dueDate),
  };
}
