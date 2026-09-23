import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { ListNotFoundError } from "../services/list.service";
import { Card } from "../entities/Card";
import {
  CardNotFoundError,
  CardSortBy,
  createCard,
  deleteCard,
  getCard,
  listCards,
  moveCard,
  updateCard,
} from "../services/card.service";
import { getCardIdsWithAnyLabel, getLabelsForCards } from "../services/card-label.service";
import { getChecklistProgressForCards } from "../services/checklist.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof ListNotFoundError) {
    res.status(404).json({ message: "Lista não encontrada" });
    return true;
  }
  if (error instanceof CardNotFoundError) {
    res.status(404).json({ message: "Card não encontrado" });
    return true;
  }
  return false;
}

function withOverdueInfo(card: Card) {
  const dueDate = card.dueDate;
  const isOverdue = Boolean(dueDate && new Date(dueDate).getTime() < Date.now());
  const overdueDays = isOverdue
    ? Math.floor((Date.now() - new Date(dueDate as Date).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return { ...card, isOverdue, ...(overdueDays !== undefined ? { overdueDays } : {}) };
}

export async function createCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { title, description } = req.body ?? {};

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ message: "Título do card é obrigatório" });
    return;
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    res.status(400).json({ message: "Descrição inválida" });
    return;
  }

  try {
    const card = await createCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.listId as string,
      title.trim(),
      description ?? null
    );
    res.status(201).json(withOverdueInfo(card));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listCardsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const sortByParam = req.query.sortBy;
  const sortBy: CardSortBy = sortByParam === "dueDate" ? "dueDate" : "position";

  try {
    let cards = await listCards(
      req.userId as string,
      req.params.boardId as string,
      req.params.listId as string,
      sortBy
    );

    const labelIdsParam = req.query.labelIds;
    const labelIds =
      typeof labelIdsParam === "string" && labelIdsParam.trim()
        ? labelIdsParam.split(",").map((id) => id.trim())
        : [];

    if (labelIds.length > 0) {
      const matchingCardIds = await getCardIdsWithAnyLabel(labelIds);
      cards = cards.filter((card) => matchingCardIds.has(card.id));
    }

    const cardIds = cards.map((card) => card.id);
    const [labelsByCard, checklistByCard] = await Promise.all([
      getLabelsForCards(cardIds),
      getChecklistProgressForCards(cardIds),
    ]);
    const enriched = cards.map((card) =>
      withOverdueInfo({
        ...card,
        labels: labelsByCard[card.id] ?? [],
        checklist: checklistByCard[card.id],
      } as Card)
    );

    res.status(200).json(enriched);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function getCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const card = await getCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(200).json(withOverdueInfo(card));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function updateCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { title, description, dueDate } = req.body ?? {};

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    res.status(400).json({ message: "Título do card inválido" });
    return;
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    res.status(400).json({ message: "Descrição inválida" });
    return;
  }

  let parsedDueDate: Date | null | undefined;
  if (dueDate !== undefined) {
    if (dueDate === null) {
      parsedDueDate = null;
    } else {
      const date = new Date(dueDate);
      if (typeof dueDate !== "string" || Number.isNaN(date.getTime())) {
        res.status(400).json({ message: "dueDate deve ser uma data ISO válida ou null" });
        return;
      }
      parsedDueDate = date;
    }
  }

  const changes: { title?: string; description?: string | null; dueDate?: Date | null } = {};
  if (typeof title === "string") changes.title = title.trim();
  if (description !== undefined) changes.description = description;
  if (parsedDueDate !== undefined) changes.dueDate = parsedDueDate;

  try {
    const card = await updateCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      changes
    );
    res.status(200).json(withOverdueInfo(card));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function moveCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { listId, position } = req.body ?? {};

  if (typeof listId !== "string" || !listId) {
    res.status(400).json({ message: "listId de destino é obrigatório" });
    return;
  }
  if (typeof position !== "number" || Number.isNaN(position) || position < 0) {
    res.status(400).json({ message: "position deve ser um número maior ou igual a 0" });
    return;
  }

  try {
    const card = await moveCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      listId,
      position
    );
    res.status(200).json(withOverdueInfo(card));
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function deleteCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await deleteCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
