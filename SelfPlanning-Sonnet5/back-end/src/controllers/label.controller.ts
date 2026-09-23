import { Response } from "express";
import { BoardNotFoundError } from "../services/board.service";
import { LABEL_COLORS, LabelColor } from "../entities/Label";
import {
  LabelNotFoundError,
  createLabel,
  deleteLabel,
  listLabels,
  updateLabel,
} from "../services/label.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function isValidColor(color: unknown): color is LabelColor {
  return typeof color === "string" && (LABEL_COLORS as readonly string[]).includes(color);
}

function handleKnownErrors(error: unknown, res: Response): boolean {
  if (error instanceof BoardNotFoundError) {
    res.status(404).json({ message: "Quadro não encontrado" });
    return true;
  }
  if (error instanceof LabelNotFoundError) {
    res.status(404).json({ message: "Etiqueta não encontrada" });
    return true;
  }
  return false;
}

export async function createLabelHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name, color } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Nome da etiqueta é obrigatório" });
    return;
  }
  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ message: `Cor inválida. Use uma de: ${LABEL_COLORS.join(", ")}` });
    return;
  }

  try {
    const label = await createLabel(
      req.userId as string,
      req.params.boardId as string,
      name.trim(),
      color ?? "gray"
    );
    res.status(201).json(label);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function listLabelsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const labels = await listLabels(req.userId as string, req.params.boardId as string);
    res.status(200).json(labels);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function updateLabelHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name, color } = req.body ?? {};

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    res.status(400).json({ message: "Nome da etiqueta inválido" });
    return;
  }
  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ message: `Cor inválida. Use uma de: ${LABEL_COLORS.join(", ")}` });
    return;
  }

  const changes: { name?: string; color?: LabelColor } = {};
  if (typeof name === "string") changes.name = name.trim();
  if (color !== undefined) changes.color = color;

  try {
    const label = await updateLabel(
      req.userId as string,
      req.params.boardId as string,
      req.params.labelId as string,
      changes
    );
    res.status(200).json(label);
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}

export async function deleteLabelHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await deleteLabel(
      req.userId as string,
      req.params.boardId as string,
      req.params.labelId as string
    );
    res.status(204).send();
  } catch (error) {
    if (handleKnownErrors(error, res)) return;
    throw error;
  }
}
