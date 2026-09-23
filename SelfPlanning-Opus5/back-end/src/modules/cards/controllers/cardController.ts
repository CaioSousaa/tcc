import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { requirePosition } from "../../lists/listValidation";
import { optionalDescription, optionalDueDate, requireCardTitle } from "../cardValidation";
import {
  createCard,
  deleteCard,
  listCards,
  moveCard,
  updateCard,
} from "../services/cardService";

function authenticatedUserId(request: Request): string {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return authenticated.id;
}

function boardIdFrom(request: Request): string {
  return requireUuid(request.params.boardId, "boardId");
}

export async function create(request: Request, response: Response): Promise<void> {
  const card = await createCard({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    listId: requireUuid(request.body?.listId, "listId"),
    title: requireCardTitle(request.body?.title),
    description: optionalDescription(request.body?.description),
    dueDate: optionalDueDate(request.body?.dueDate),
  });

  response.status(201).json({ card });
}

/** Aceita ?labelIds=id1,id2 ou ?labelIds=id1&labelIds=id2. */
function labelFilterFrom(request: Request): string[] {
  const raw = request.query.labelIds;

  const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];

  return values
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => requireUuid(value, "labelIds"));
}

function isTrue(value: unknown): boolean {
  return value === "true" || value === "1";
}

export async function index(request: Request, response: Response): Promise<void> {
  const cards = await listCards(boardIdFrom(request), authenticatedUserId(request), {
    labelFilter: labelFilterFrom(request),
    sortByDueDate: request.query.sort === "dueDate",
    overdueOnly: isTrue(request.query.overdue),
  });

  response.status(200).json({ cards });
}

export async function update(request: Request, response: Response): Promise<void> {
  const card = await updateCard({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    cardId: requireUuid(request.params.id, "id"),
    title: requireCardTitle(request.body?.title),
    description: optionalDescription(request.body?.description),
    dueDate: optionalDueDate(request.body?.dueDate),
  });

  response.status(200).json({ card });
}

export async function move(request: Request, response: Response): Promise<void> {
  const cards = await moveCard({
    boardId: boardIdFrom(request),
    userId: authenticatedUserId(request),
    cardId: requireUuid(request.params.id, "id"),
    listId: requireUuid(request.body?.listId, "listId"),
    position: requirePosition(request.body?.position),
  });

  response.status(200).json({ cards });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const cards = await deleteCard(
    requireUuid(request.params.id, "id"),
    boardIdFrom(request),
    authenticatedUserId(request)
  );

  response.status(200).json({ cards });
}
