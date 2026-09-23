import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { findAccessibleBoard, findAccessibleList } from "../utils/ownership";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../entities/ChecklistItem";
import { CardAssignee } from "../entities/CardAssignee";
import { CardLabel } from "../entities/CardLabel";
import { LabelColor } from "../entities/Label";

const MAX_TITLE_LENGTH = 200;

interface AssigneeSummary {
  userId: string;
  name: string;
}

interface LabelSummary {
  id: string;
  name: string;
  color: LabelColor;
}

function toCardResponse(
  card: Card,
  checklist?: { total: number; completed: number },
  assignees?: AssigneeSummary[],
  labels?: LabelSummary[],
) {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    position: card.position,
    listId: card.listId,
    boardId: card.boardId,
    checklistTotal: checklist?.total ?? 0,
    checklistCompleted: checklist?.completed ?? 0,
    assignees: assignees ?? [],
    labels: labels ?? [],
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

async function getLabelSummaries(
  cardIds: string[],
): Promise<Map<string, LabelSummary[]>> {
  const summaries = new Map<string, LabelSummary[]>();
  if (cardIds.length === 0) return summaries;

  const rows = await AppDataSource.getRepository(CardLabel)
    .createQueryBuilder("cardLabel")
    .leftJoinAndSelect("cardLabel.label", "label")
    .where("cardLabel.card_id IN (:...cardIds)", { cardIds })
    .getMany();

  for (const row of rows) {
    const list = summaries.get(row.cardId) ?? [];
    list.push({ id: row.label.id, name: row.label.name, color: row.label.color });
    summaries.set(row.cardId, list);
  }

  return summaries;
}

async function getAssigneeSummaries(
  cardIds: string[],
): Promise<Map<string, AssigneeSummary[]>> {
  const summaries = new Map<string, AssigneeSummary[]>();
  if (cardIds.length === 0) return summaries;

  const rows = await AppDataSource.getRepository(CardAssignee)
    .createQueryBuilder("assignee")
    .leftJoinAndSelect("assignee.user", "user")
    .where("assignee.card_id IN (:...cardIds)", { cardIds })
    .getMany();

  for (const row of rows) {
    const list = summaries.get(row.cardId) ?? [];
    list.push({ userId: row.user.id, name: row.user.name });
    summaries.set(row.cardId, list);
  }

  return summaries;
}

async function getChecklistSummaries(
  cardIds: string[],
): Promise<Map<string, { total: number; completed: number }>> {
  const summaries = new Map<string, { total: number; completed: number }>();
  if (cardIds.length === 0) return summaries;

  const rows = (await AppDataSource.getRepository(ChecklistItem)
    .createQueryBuilder("item")
    .select("item.card_id", "cardId")
    .addSelect("COUNT(*)", "total")
    .addSelect(
      "SUM(CASE WHEN item.completed THEN 1 ELSE 0 END)",
      "completed",
    )
    .where("item.card_id IN (:...cardIds)", { cardIds })
    .groupBy("item.card_id")
    .getRawMany()) as { cardId: string; total: string; completed: string }[];

  for (const row of rows) {
    summaries.set(row.cardId, {
      total: Number(row.total),
      completed: Number(row.completed),
    });
  }

  return summaries;
}

async function reindexList(listId: string, cards: Card[]): Promise<void> {
  const cardRepository = AppDataSource.getRepository(Card);
  await Promise.all(
    cards.map((card, index) => {
      if (card.listId === listId && card.position === index) {
        return Promise.resolve();
      }
      card.position = index;
      return cardRepository.save(card);
    }),
  );
}

export async function listCards(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const cardRepository = AppDataSource.getRepository(Card);
  const cards = await cardRepository.find({
    where: { boardId: board.id },
    order: { position: "ASC" },
  });

  const cardIds = cards.map((card) => card.id);
  const [summaries, assigneeSummaries, labelSummaries] = await Promise.all([
    getChecklistSummaries(cardIds),
    getAssigneeSummaries(cardIds),
    getLabelSummaries(cardIds),
  ]);

  res.status(200).json({
    cards: cards.map((card) =>
      toCardResponse(
        card,
        summaries.get(card.id),
        assigneeSummaries.get(card.id),
        labelSummaries.get(card.id),
      ),
    ),
  });
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export async function createCard(req: Request, res: Response): Promise<void> {
  const { title, description, listId, dueDate } = req.body as {
    title?: string;
    description?: string;
    listId?: string;
    dueDate?: string | null;
  };

  if (!title?.trim()) {
    res.status(400).json({ error: "Título do card é obrigatório." });
    return;
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Título do card deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  if (!listId) {
    res.status(400).json({ error: "Lista é obrigatória." });
    return;
  }

  if (dueDate && !isValidDateString(dueDate)) {
    res.status(400).json({ error: "Prazo inválido." });
    return;
  }

  const list = await findAccessibleList(
    req.params.boardId as string,
    listId,
    req.userId as string,
  );
  if (!list) {
    res.status(404).json({ error: "Lista não encontrada." });
    return;
  }

  const cardRepository = AppDataSource.getRepository(Card);
  const { maxPosition } = (await cardRepository
    .createQueryBuilder("card")
    .select("MAX(card.position)", "maxPosition")
    .where("card.list_id = :listId", { listId: list.id })
    .getRawOne()) as { maxPosition: number | null };

  const card = cardRepository.create({
    title: title.trim(),
    description: description?.trim() ? description.trim() : null,
    dueDate: dueDate ? new Date(dueDate) : null,
    position: (maxPosition ?? -1) + 1,
    listId: list.id,
    boardId: list.boardId,
  });
  await cardRepository.save(card);

  res.status(201).json({ card: toCardResponse(card) });
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  const { title, description, listId, position, dueDate } = req.body as {
    title?: string;
    description?: string | null;
    listId?: string;
    position?: number;
    dueDate?: string | null;
  };

  if (title !== undefined && !title.trim()) {
    res.status(400).json({ error: "Título do card é obrigatório." });
    return;
  }

  if (title !== undefined && title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Título do card deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  if (dueDate && !isValidDateString(dueDate)) {
    res.status(400).json({ error: "Prazo inválido." });
    return;
  }

  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const cardRepository = AppDataSource.getRepository(Card);
  const card = await cardRepository.findOne({
    where: { id: req.params.id as string, boardId: board.id },
  });
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  if (title !== undefined) card.title = title.trim();
  if (description !== undefined) {
    card.description = description?.trim() ? description.trim() : null;
  }
  if (dueDate !== undefined) {
    card.dueDate = dueDate ? new Date(dueDate) : null;
  }

  const isMoving = listId !== undefined || position !== undefined;

  if (!isMoving) {
    await cardRepository.save(card);
    const summary = (await getChecklistSummaries([card.id])).get(card.id);
    res.status(200).json({ card: toCardResponse(card, summary) });
    return;
  }

  const targetListId = listId ?? card.listId;

  if (targetListId !== card.listId) {
    const targetList = await findAccessibleList(
      board.id,
      targetListId,
      req.userId as string,
    );
    if (!targetList) {
      res.status(400).json({ error: "Lista de destino inválida." });
      return;
    }
  }

  const sourceListId = card.listId;

  await AppDataSource.transaction(async (manager) => {
    const transactionCardRepository = manager.getRepository(Card);

    if (targetListId === sourceListId) {
      const siblings = await transactionCardRepository.find({
        where: { listId: sourceListId },
        order: { position: "ASC" },
      });
      const withoutCard = siblings.filter((item) => item.id !== card.id);
      const insertIndex = Math.max(
        0,
        Math.min(position ?? withoutCard.length, withoutCard.length),
      );
      withoutCard.splice(insertIndex, 0, card);

      await Promise.all(
        withoutCard.map((item, index) => {
          if (item.position === index) return Promise.resolve();
          item.position = index;
          return transactionCardRepository.save(item);
        }),
      );
    } else {
      const oldSiblings = await transactionCardRepository.find({
        where: { listId: sourceListId },
        order: { position: "ASC" },
      });
      const remainingOld = oldSiblings.filter((item) => item.id !== card.id);
      await Promise.all(
        remainingOld.map((item, index) => {
          if (item.position === index) return Promise.resolve();
          item.position = index;
          return transactionCardRepository.save(item);
        }),
      );

      const newSiblings = await transactionCardRepository.find({
        where: { listId: targetListId },
        order: { position: "ASC" },
      });
      const insertIndex = Math.max(
        0,
        Math.min(position ?? newSiblings.length, newSiblings.length),
      );
      card.listId = targetListId;
      newSiblings.splice(insertIndex, 0, card);

      await Promise.all(
        newSiblings.map((item, index) => {
          item.position = index;
          return transactionCardRepository.save(item);
        }),
      );
    }
  });

  const summary = (await getChecklistSummaries([card.id])).get(card.id);
  res.status(200).json({ card: toCardResponse(card, summary) });
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const cardRepository = AppDataSource.getRepository(Card);
  const card = await cardRepository.findOne({
    where: { id: req.params.id as string, boardId: board.id },
  });
  if (!card) {
    res.status(404).json({ error: "Card não encontrado." });
    return;
  }

  const { listId } = card;
  await cardRepository.remove(card);

  const remaining = await cardRepository.find({
    where: { listId },
    order: { position: "ASC" },
  });
  await reindexList(listId, remaining);

  res.status(204).send();
}
