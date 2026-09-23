import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { requireUuid } from "../../../shared/validation/validators";
import { requireChecklistTitle, requireDone } from "../checklistValidation";
import {
  ChecklistScope,
  createItem,
  deleteItem,
  listItems,
  toggleItem,
  updateItem,
} from "../services/checklistService";

function scopeFrom(request: Request): ChecklistScope {
  const authenticated = request.user;

  if (!authenticated) {
    throw new AppError("Token de acesso não informado", 401);
  }

  return {
    boardId: requireUuid(request.params.boardId, "boardId"),
    cardId: requireUuid(request.params.cardId, "cardId"),
    userId: authenticated.id,
  };
}

export async function create(request: Request, response: Response): Promise<void> {
  const items = await createItem({
    ...scopeFrom(request),
    title: requireChecklistTitle(request.body?.title),
  });

  response.status(201).json({ items });
}

export async function index(request: Request, response: Response): Promise<void> {
  const items = await listItems(scopeFrom(request));

  response.status(200).json({ items });
}

export async function update(request: Request, response: Response): Promise<void> {
  const items = await updateItem({
    ...scopeFrom(request),
    itemId: requireUuid(request.params.itemId, "itemId"),
    title: requireChecklistTitle(request.body?.title),
  });

  response.status(200).json({ items });
}

export async function toggle(request: Request, response: Response): Promise<void> {
  const items = await toggleItem({
    ...scopeFrom(request),
    itemId: requireUuid(request.params.itemId, "itemId"),
    done: requireDone(request.body?.done),
  });

  response.status(200).json({ items });
}

export async function destroy(request: Request, response: Response): Promise<void> {
  const items = await deleteItem(requireUuid(request.params.itemId, "itemId"), scopeFrom(request));

  response.status(200).json({ items });
}
