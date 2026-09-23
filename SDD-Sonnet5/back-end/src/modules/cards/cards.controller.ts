import { NextFunction, Request, RequestHandler, Response } from "express";
import { ValidationError } from "../../shared/errors";
import { UnauthenticatedError } from "../auth/auth.errors";
import { CardsService } from "./cards.service";
import { createCardSchema, formatZodError, updateCardSchema } from "./cards.schemas";
import { Card } from "./entities/card.entity";
import { CardProgress } from "../checklists/repositories/repository.types";
import { AssigneeInfo } from "./repositories/card-assignment.repository.types";
import { LabelInfo } from "./repositories/card-label.repository.types";

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next: NextFunction) => {
    return handler(req, res).catch(next);
  };
}

function serializeProgress(raw: CardProgress | undefined) {
  if (!raw || raw.total === 0) {
    return null;
  }
  return {
    completed: raw.completed,
    total: raw.total,
    percentage: Math.round((raw.completed / raw.total) * 100),
  };
}

/** "Hoje" é sempre a data UTC do servidor (RF10, Plano §2.2) — nunca a de um fuso de cliente. */
function todayUTCString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDateString(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

type DueDateStatus = "overdue" | "due_soon" | null;

/** RF10, RN-05, RN-06, RN-07 — nunca armazenado, sempre recalculado a partir de `dueDate` e de hoje. */
function computeDueDateStatus(dueDate: string | null): DueDateStatus {
  if (!dueDate) {
    return null;
  }
  const today = todayUTCString();
  if (dueDate < today) {
    return "overdue";
  }
  const tomorrow = addDaysToDateString(today, 1);
  if (dueDate === today || dueDate === tomorrow) {
    return "due_soon";
  }
  return null;
}

function serializeCard(
  card: Card,
  progress?: CardProgress,
  assignees: AssigneeInfo[] = [],
  labels: LabelInfo[] = [],
) {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    listId: card.listId,
    position: card.position,
    dueDate: card.dueDate,
    dueDateStatus: computeDueDateStatus(card.dueDate),
    progress: serializeProgress(progress),
    assignees,
    labels,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

function requireOwnerId(req: Request): string {
  if (!req.user) {
    throw new UnauthenticatedError();
  }
  return req.user.id;
}

function parseLabelIds(req: Request): string[] | undefined {
  const raw = req.query["labelIds"];
  if (typeof raw !== "string" || raw.trim() === "") {
    return undefined;
  }
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

function parseSortByDueDate(req: Request): boolean {
  return req.query["sortByDueDate"] === "true";
}

export function buildCardsController(service: CardsService) {
  const create = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    const parsed = createCardSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const card = await service.create(ownerId, boardId, listId, parsed.data);
    res.status(201).json(serializeCard(card));
  });

  const list = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    const labelIds = parseLabelIds(req);
    const sortByDueDate = parseSortByDueDate(req);
    const cards = await service.list(ownerId, boardId, listId, labelIds, sortByDueDate);
    const cardIds = cards.map((card) => card.id);
    const [progressByCard, assigneesByCard, labelsByCard] = await Promise.all([
      service.getProgressForCards(cardIds),
      service.getAssigneesForCards(cardIds),
      service.getLabelsForCards(cardIds),
    ]);
    res.status(200).json({
      cards: cards.map((card) =>
        serializeCard(
          card,
          progressByCard[card.id],
          assigneesByCard[card.id],
          labelsByCard[card.id],
        ),
      ),
    });
  });

  const update = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    const cardId = req.params["cardId"] as string;
    const parsed = updateCardSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(formatZodError(parsed.error));
    }

    const updated = await service.update(ownerId, boardId, listId, cardId, parsed.data);
    const [progressByCard, assigneesByCard, labelsByCard] = await Promise.all([
      service.getProgressForCards([updated.id]),
      service.getAssigneesForCards([updated.id]),
      service.getLabelsForCards([updated.id]),
    ]);
    res
      .status(200)
      .json(
        serializeCard(
          updated,
          progressByCard[updated.id],
          assigneesByCard[updated.id],
          labelsByCard[updated.id],
        ),
      );
  });

  const remove = asyncHandler(async (req, res) => {
    const ownerId = requireOwnerId(req);
    const boardId = req.params["boardId"] as string;
    const listId = req.params["listId"] as string;
    const cardId = req.params["cardId"] as string;
    await service.remove(ownerId, boardId, listId, cardId);
    res.status(204).send();
  });

  return { create, list, update, remove };
}
