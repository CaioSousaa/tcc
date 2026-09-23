import { EntityManager, In } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { BoardList } from "../../lists/entities/BoardList";
import {
  CardsByList,
  dueStatusOf,
  ChecklistProgress,
  EMPTY_CHECKLIST_PROGRESS,
  toCardView,
} from "../cardView";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../../checklists/entities/ChecklistItem";
import { assigneesByCards } from "../../members/services/assigneeGrouping";
import { labelsByCards } from "../../labels/services/labelGrouping";
import { countCommentsByCards } from "../../comments/services/commentGrouping";

/** Monta o mapa listId → cards do quadro, com chave para toda lista, mesmo vazia. */
export interface CardQueryOptions {
  labelFilter?: string[];
  sortByDueDate?: boolean;
  overdueOnly?: boolean;
}

/** Prazo mais próximo primeiro; card sem prazo vai para o fim da lista. */
function byDueDate(first: { dueDate: string | null }, second: { dueDate: string | null }): number {
  if (first.dueDate === second.dueDate) {
    return 0;
  }

  if (first.dueDate === null) {
    return 1;
  }

  if (second.dueDate === null) {
    return -1;
  }

  return first.dueDate < second.dueDate ? -1 : 1;
}

export async function groupCardsByBoard(
  boardId: string,
  manager: EntityManager = AppDataSource.manager,
  options: CardQueryOptions = {}
): Promise<CardsByList> {
  const labelFilter = options.labelFilter ?? [];
  const lists = await manager.getRepository(BoardList).find({
    where: { boardId },
    order: { position: "ASC" },
  });

  const grouped: CardsByList = {};

  for (const list of lists) {
    grouped[list.id] = [];
  }

  if (lists.length === 0) {
    return grouped;
  }

  const cards = await manager.getRepository(Card).find({
    where: { listId: In(lists.map((list) => list.id)) },
    order: { position: "ASC" },
  });

  const cardIds = cards.map((card) => card.id);
  const progress = await countChecklistByCards(cardIds, manager);
  const assignees = await assigneesByCards(cardIds);
  const labels = await labelsByCards(cardIds);
  const commentCounts = await countCommentsByCards(cardIds, manager);

  for (const card of cards) {
    const cardLabels = labels.get(card.id) ?? [];

    const matchesFilter =
      labelFilter.length === 0 ||
      cardLabels.some((label) => labelFilter.includes(label.id));

    if (!matchesFilter) {
      continue;
    }

    if (options.overdueOnly && dueStatusOf(card.dueDate) !== "overdue") {
      continue;
    }

    grouped[card.listId]?.push(
      toCardView(
        card,
        progress.get(card.id) ?? EMPTY_CHECKLIST_PROGRESS,
        assignees.get(card.id) ?? [],
        cardLabels,
        commentCounts.get(card.id) ?? 0
      )
    );
  }

  if (options.sortByDueDate) {
    for (const listId of Object.keys(grouped)) {
      grouped[listId]?.sort(byDueDate);
    }
  }

  return grouped;
}

export async function countCardsByList(
  listIds: string[],
  manager: EntityManager = AppDataSource.manager
): Promise<Map<string, number>> {
  const counts = new Map<string, number>(listIds.map((listId) => [listId, 0]));

  if (listIds.length === 0) {
    return counts;
  }

  const rows = await manager
    .getRepository(Card)
    .createQueryBuilder("card")
    .select("card.list_id", "listId")
    .addSelect("COUNT(card.id)", "total")
    .where("card.list_id IN (:...listIds)", { listIds })
    .groupBy("card.list_id")
    .getRawMany<{ listId: string; total: string }>();

  for (const row of rows) {
    counts.set(row.listId, Number(row.total));
  }

  return counts;
}

export async function countChecklistByCards(
  cardIds: string[],
  manager: EntityManager = AppDataSource.manager
): Promise<Map<string, ChecklistProgress>> {
  const progress = new Map<string, ChecklistProgress>(
    cardIds.map((cardId) => [cardId, { ...EMPTY_CHECKLIST_PROGRESS }])
  );

  if (cardIds.length === 0) {
    return progress;
  }

  const rows = await manager
    .getRepository(ChecklistItem)
    .createQueryBuilder("item")
    .select("item.card_id", "cardId")
    .addSelect("COUNT(item.id)", "total")
    .addSelect("COUNT(item.id) FILTER (WHERE item.done)", "done")
    .where("item.card_id IN (:...cardIds)", { cardIds })
    .groupBy("item.card_id")
    .getRawMany<{ cardId: string; total: string; done: string }>();

  for (const row of rows) {
    progress.set(row.cardId, {
      checklistTotal: Number(row.total),
      checklistDone: Number(row.done),
    });
  }

  return progress;
}
