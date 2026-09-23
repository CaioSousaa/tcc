import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import { BOARD_COLORS, Board, BoardColor } from "../entities/Board";
import { BoardMember } from "../entities/BoardMember";
import {
  BoardRole,
  findAccessibleBoard,
  findOwnedBoard,
  getBoardRole,
  requireBoardAdmin,
} from "../utils/ownership";

const MAX_TITLE_LENGTH = 120;

function toBoardResponse(board: Board, role: BoardRole) {
  return {
    id: board.id,
    title: board.title,
    color: board.color,
    role,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

function isValidColor(color: unknown): color is BoardColor {
  return typeof color === "string" && (BOARD_COLORS as readonly string[]).includes(color);
}

export async function listBoards(req: Request, res: Response): Promise<void> {
  const userId = req.userId as string;
  const boardRepository = AppDataSource.getRepository(Board);
  const memberRepository = AppDataSource.getRepository(BoardMember);

  const [ownedBoards, memberships] = await Promise.all([
    boardRepository.find({ where: { ownerId: userId } }),
    memberRepository.find({ where: { userId }, relations: { board: true } }),
  ]);

  const results = [
    ...ownedBoards.map((board) => toBoardResponse(board, "owner" as BoardRole)),
    ...memberships.map((member) =>
      toBoardResponse(member.board, member.role),
    ),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  res.status(200).json({ boards: results });
}

export async function getBoard(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.id as string,
    req.userId as string,
  );

  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const role = await getBoardRole(board.id, req.userId as string);
  res.status(200).json({ board: toBoardResponse(board, role as BoardRole) });
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  const { title, color } = req.body as { title?: string; color?: string };

  if (!title?.trim()) {
    res.status(400).json({ error: "Nome do quadro é obrigatório." });
    return;
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Nome do quadro deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ error: "Cor inválida." });
    return;
  }

  const boardRepository = AppDataSource.getRepository(Board);
  const board = boardRepository.create({
    title: title.trim(),
    color: color ?? "navy",
    ownerId: req.userId as string,
  });
  await boardRepository.save(board);

  res.status(201).json({ board: toBoardResponse(board, "owner") });
}

export async function updateBoard(req: Request, res: Response): Promise<void> {
  const { title, color } = req.body as { title?: string; color?: string };

  if (title !== undefined && !title.trim()) {
    res.status(400).json({ error: "Nome do quadro é obrigatório." });
    return;
  }

  if (title !== undefined && title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Nome do quadro deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  if (color !== undefined && !isValidColor(color)) {
    res.status(400).json({ error: "Cor inválida." });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.id as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const boardRepository = AppDataSource.getRepository(Board);
  if (title !== undefined) board.title = title.trim();
  if (color !== undefined) board.color = color;
  await boardRepository.save(board);

  const role = await getBoardRole(board.id, req.userId as string);
  res.status(200).json({ board: toBoardResponse(board, role as BoardRole) });
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  const board = await findOwnedBoard(
    req.params.id as string,
    req.userId as string,
  );

  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const boardRepository = AppDataSource.getRepository(Board);
  await boardRepository.remove(board);

  res.status(204).send();
}
