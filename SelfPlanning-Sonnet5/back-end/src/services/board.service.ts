import { AppDataSource } from "../config/data-source";
import { Board, BoardColor } from "../entities/Board";

const boardRepository = () => AppDataSource.getRepository(Board);

export class BoardNotFoundError extends Error {}

export async function createBoard(
  ownerId: string,
  name: string,
  color: BoardColor
): Promise<Board> {
  const board = boardRepository().create({ ownerId, name, color });
  return boardRepository().save(board);
}

export async function listBoards(ownerId: string): Promise<Board[]> {
  return boardRepository().find({
    where: { ownerId },
    order: { createdAt: "DESC" },
  });
}

export async function getBoard(ownerId: string, id: string): Promise<Board> {
  const board = await boardRepository().findOne({ where: { id, ownerId } });
  if (!board) {
    throw new BoardNotFoundError();
  }
  return board;
}

export async function findBoardById(id: string): Promise<Board> {
  const board = await boardRepository().findOne({ where: { id } });
  if (!board) {
    throw new BoardNotFoundError();
  }
  return board;
}

export async function updateBoard(
  ownerId: string,
  id: string,
  changes: { name?: string; color?: BoardColor }
): Promise<Board> {
  const board = await getBoard(ownerId, id);
  if (changes.name !== undefined) board.name = changes.name;
  if (changes.color !== undefined) board.color = changes.color;
  return boardRepository().save(board);
}

export async function deleteBoard(ownerId: string, id: string): Promise<void> {
  const board = await getBoard(ownerId, id);
  await boardRepository().remove(board);
}
