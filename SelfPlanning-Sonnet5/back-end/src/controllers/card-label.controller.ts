import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { CardNotFoundError } from "../services/card.service";
import { LabelNotFoundError } from "../services/label.service";
import {
  AlreadyLabeledError,
  CardLabelNotFoundError,
  addLabelToCard,
  listCardLabels,
  removeLabelFromCard,
} from "../services/card-label.service";
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
  if (error instanceof LabelNotFoundError) {
    res.status(404).json({ message: "Etiqueta não encontrada" });
    return true;
  }
  if (error instanceof AlreadyLabeledError) {
    res.status(409).json({ message: "Etiqueta já aplicada a este card" });
    return true;
  }
  if (error instanceof CardLabelNotFoundError) {
    res.status(404).json({ message: "Etiqueta não aplicada a este card" });
    return true;
  }
  return false;
}

export async function listCardLabelsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const labels = await listCardLabels(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string
    );
    res.status(200).json(labels);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function addLabelToCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { labelId } = req.body ?? {};

  if (typeof labelId !== "string" || !labelId) {
    res.status(400).json({ message: "labelId é obrigatório" });
    return;
  }

  try {
    const labels = await addLabelToCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      labelId
    );
    res.status(201).json(labels);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function removeLabelFromCardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await removeLabelFromCard(
      req.userId as string,
      req.params.boardId as string,
      req.params.cardId as string,
      req.params.labelId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
