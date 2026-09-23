import { AppDataSource } from "./data-source";
import { Board } from "../entities/Board";
import { List } from "../entities/List";
import { Card } from "../entities/Card";
import { BoardMember } from "../entities/BoardMember";

export type BoardRole = "owner" | "admin" | "member";

export interface BoardAccess {
  board: Board;
  role: BoardRole;
}

export async function getBoardAccess(
  boardId: string,
  userId: string,
): Promise<BoardAccess | null> {
  const boardRepository = AppDataSource.getRepository(Board);
  const board = await boardRepository.findOne({ where: { id: boardId } });
  if (!board) return null;

  if (board.ownerId === userId) return { board, role: "owner" };

  const memberRepository = AppDataSource.getRepository(BoardMember);
  const member = await memberRepository.findOne({
    where: { boardId: board.id, userId },
  });
  if (!member) return null;

  return { board, role: member.role };
}

export async function getBoardRole(
  boardId: string,
  userId: string,
): Promise<BoardRole | null> {
  const access = await getBoardAccess(boardId, userId);
  return access?.role ?? null;
}

/** Any board role (owner, admin or member) can read/edit cards here. */
export async function findAccessibleBoard(
  boardId: string,
  userId: string,
): Promise<Board | null> {
  const access = await getBoardAccess(boardId, userId);
  return access?.board ?? null;
}

/** Only owner or admin can manage lists, board settings and members. */
export async function findAdminBoard(
  boardId: string,
  userId: string,
): Promise<Board | null> {
  const access = await getBoardAccess(boardId, userId);
  if (!access) return null;
  return access.role === "owner" || access.role === "admin"
    ? access.board
    : null;
}

/** Strictly the board owner — used for destructive board-level actions. */
export async function findOwnedBoard(
  boardId: string,
  userId: string,
): Promise<Board | null> {
  const boardRepository = AppDataSource.getRepository(Board);
  return boardRepository.findOne({ where: { id: boardId, ownerId: userId } });
}

type AdminAccessResult =
  | { ok: true; board: Board }
  | { ok: false; status: 404 | 403; error: string };

/** Resolves board access distinguishing "not found" from "not an admin". */
export async function requireBoardAdmin(
  boardId: string,
  userId: string,
): Promise<AdminAccessResult> {
  const access = await getBoardAccess(boardId, userId);
  if (!access) {
    return { ok: false, status: 404, error: "Quadro não encontrado." };
  }
  if (access.role !== "owner" && access.role !== "admin") {
    return {
      ok: false,
      status: 403,
      error: "Apenas administradores podem realizar esta ação.",
    };
  }
  return { ok: true, board: access.board };
}

export async function findAccessibleList(
  boardId: string,
  listId: string,
  userId: string,
): Promise<List | null> {
  const board = await findAccessibleBoard(boardId, userId);
  if (!board) return null;

  const listRepository = AppDataSource.getRepository(List);
  return listRepository.findOne({ where: { id: listId, boardId: board.id } });
}

export async function findAdminList(
  boardId: string,
  listId: string,
  userId: string,
): Promise<List | null> {
  const board = await findAdminBoard(boardId, userId);
  if (!board) return null;

  const listRepository = AppDataSource.getRepository(List);
  return listRepository.findOne({ where: { id: listId, boardId: board.id } });
}

export async function findAccessibleCard(
  boardId: string,
  cardId: string,
  userId: string,
): Promise<Card | null> {
  const board = await findAccessibleBoard(boardId, userId);
  if (!board) return null;

  const cardRepository = AppDataSource.getRepository(Card);
  return cardRepository.findOne({ where: { id: cardId, boardId: board.id } });
}
