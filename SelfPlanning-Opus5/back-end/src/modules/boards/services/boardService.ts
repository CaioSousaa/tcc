import { AppError } from "../../../shared/errors/AppError";
import { MemberRole } from "../../members/memberRoles";
import { BoardMember } from "../../members/entities/BoardMember";
import { memberRepository } from "../../members/repositories/memberRepository";
import { userRepository } from "../../users/repositories/userRepository";
import { BoardColor } from "../boardColors";
import { BoardView, toBoardView } from "../boardView";
import { Board } from "../entities/Board";
import { boardRepository } from "../repositories/boardRepository";
import { statsByBoards, statsOfBoard } from "./boardStats";

export interface CreateBoardRequest {
  ownerId: string;
  name: string;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
}

export interface UpdateBoardRequest {
  boardId: string;
  actorId: string;
  name: string;
  color: BoardColor;
  blockListDeletionWithCards: boolean;
}

export interface BoardAccess {
  board: Board;
  member: BoardMember;
}

/**
 * O acesso ao quadro é dado pela associação ativa do usuário, e não mais pela
 * propriedade: quem não é membro recebe a mesma resposta de quadro inexistente.
 */
export async function findBoardAccess(boardId: string, userId: string): Promise<BoardAccess> {
  const board = await boardRepository().findOne({ where: { id: boardId } });

  if (!board) {
    throw new AppError("Quadro não encontrado", 404);
  }

  const member = await memberRepository().findOne({
    where: { boardId, userId, status: "active" },
  });

  if (!member) {
    throw new AppError("Quadro não encontrado", 404);
  }

  return { board, member };
}

export async function requireBoardAccess(boardId: string, userId: string): Promise<Board> {
  const { board } = await findBoardAccess(boardId, userId);

  return board;
}

export async function requireBoardAdmin(boardId: string, userId: string): Promise<Board> {
  const { board, member } = await findBoardAccess(boardId, userId);

  if (member.role !== "admin") {
    throw new AppError("Apenas administradores do quadro podem fazer isso", 403);
  }

  return board;
}

async function roleOf(boardId: string, userId: string): Promise<MemberRole> {
  const member = await memberRepository().findOne({
    where: { boardId, userId, status: "active" },
  });

  return member?.role ?? "member";
}

export async function createBoard(data: CreateBoardRequest): Promise<BoardView> {
  const owner = await userRepository().findOne({ where: { id: data.ownerId } });

  if (!owner) {
    throw new AppError("Sessão expirada ou inválida", 401);
  }

  const repository = boardRepository();

  const board = repository.create({
    name: data.name,
    color: data.color,
    blockListDeletionWithCards: data.blockListDeletionWithCards,
    ownerId: data.ownerId,
  });

  await repository.save(board);

  const members = memberRepository();

  await members.save(
    members.create({
      boardId: board.id,
      userId: owner.id,
      email: owner.email,
      role: "admin",
      status: "active",
    })
  );

  return toBoardView(board, "admin");
}

export async function listBoards(userId: string): Promise<BoardView[]> {
  const memberships = await memberRepository().find({
    where: { userId, status: "active" },
    relations: { board: true },
  });

  const boards = memberships
    .filter((membership) => membership.board !== null)
    .sort((first, second) => second.board.createdAt.getTime() - first.board.createdAt.getTime());

  const stats = await statsByBoards(boards.map((membership) => membership.board.id));

  return boards.map((membership) =>
    toBoardView(membership.board, membership.role, stats.get(membership.board.id))
  );
}

export async function showBoard(boardId: string, userId: string): Promise<BoardView> {
  const { board, member } = await findBoardAccess(boardId, userId);

  return toBoardView(board, member.role, await statsOfBoard(board.id));
}

export async function updateBoard(data: UpdateBoardRequest): Promise<BoardView> {
  const board = await requireBoardAdmin(data.boardId, data.actorId);

  board.name = data.name;
  board.color = data.color;
  board.blockListDeletionWithCards = data.blockListDeletionWithCards;

  await boardRepository().save(board);

  return toBoardView(board, await roleOf(board.id, data.actorId), await statsOfBoard(board.id));
}

export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  const board = await requireBoardAdmin(boardId, userId);

  await boardRepository().remove(board);
}
