import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { CardNotFoundError } from "../services/card.service";
import {
  ChecklistItemNotFoundError,
  createChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  updateChecklistItem,
} from "../services/checklist.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof CardNotFoundError) {
    res.status(404).json({ message: "Card não encontrado" });
    return true;
  }
  if (error instanceof ChecklistItemNotFoundError) {
    res.status(404).json({ message: "Item do checklist não encontrado" });
    return true;
  }
  return false;
}

export async function createChecklistItemHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { text } = req.body ?? {};

  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ message: "Texto do item é obrigatório" });
    return;
  }

  try {
    const item = await createChecklistItem(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      text.trim()
    );
    res.status(201).json(item);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listChecklistItemsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const items = await listChecklistItems(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(200).json(items);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function updateChecklistItemHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { text, done } = req.body ?? {};

  if (text !== undefined && (typeof text !== "string" || !text.trim())) {
    res.status(400).json({ message: "Texto do item inválido" });
    return;
  }
  if (done !== undefined && typeof done !== "boolean") {
    res.status(400).json({ message: "done deve ser um booleano" });
    return;
  }

  const changes: { text?: string; done?: boolean } = {};
  if (typeof text === "string") changes.text = text.trim();
  if (typeof done === "boolean") changes.done = done;

  try {
    const item = await updateChecklistItem(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      req.params.itemId as string,
      changes
    );
    res.status(200).json(item);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function deleteChecklistItemHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await deleteChecklistItem(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      req.params.itemId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
