import { Response } from "express";
import { BOARD_COLORS, BoardColor } from "../entities/Board";
import {
  BoardNotFoundError,
  createBoard,
  deleteBoard,
  getBoard,
  listBoards,
  updateBoard,
} from "../services/board.service";
import { addMember } from "../services/board-member.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

function isValidColor(color: unknown): color is BoardColor {
  return typeof color === "string" && (BOARD_COLORS as readonly string[]).includes(color);
}

export async function createBoardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name, color } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    res.status(400).json({ message: "Nome do quadro é obrigatório" });
    return;
  }
  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ message: `Cor inválida. Use uma de: ${BOARD_COLORS.join(", ")}` });
    return;
  }

  const board = await createBoard(req.userId as string, name.trim(), color ?? "slate");
  await addMember(board.id, req.userId as string, "admin");
  res.status(201).json(board);
}

export async function listBoardsHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const boards = await listBoards(req.userId as string);
  res.status(200).json(boards);
}

export async function getBoardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const board = await getBoard(req.userId as string, req.params.id as string);
    res.status(200).json(board);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({ message: "Quadro não encontrado" });
      return;
    }
    throw error;
  }
}

export async function updateBoardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const { name, color } = req.body ?? {};

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    res.status(400).json({ message: "Nome do quadro inválido" });
    return;
  }
  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ message: `Cor inválida. Use uma de: ${BOARD_COLORS.join(", ")}` });
    return;
  }

  const changes: { name?: string; color?: BoardColor } = {};
  if (typeof name === "string") changes.name = name.trim();
  if (color !== undefined) changes.color = color;

  try {
    const board = await updateBoard(req.userId as string, req.params.id as string, changes);
    res.status(200).json(board);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({ message: "Quadro não encontrado" });
      return;
    }
    throw error;
  }
}

export async function deleteBoardHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    await deleteBoard(req.userId as string, req.params.id as string);
    res.status(204).send();
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      res.status(404).json({ message: "Quadro não encontrado" });
      return;
    }
    throw error;
  }
}
