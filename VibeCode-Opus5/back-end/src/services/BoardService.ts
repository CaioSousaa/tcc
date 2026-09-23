import { AppDataSource } from "../data-source";
import { Board } from "../entities/Board";
import { BoardMember, type BoardMemberRole } from "../entities/BoardMember";
import type {
  CreateBoardInput,
  UpdateBoardInput,
} from "../schemas/board.schema";
import { AppError } from "../utils/AppError";

export interface PublicBoard {
  id: string;
  title: string;
  color: string;
  role: BoardMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicBoard(board: Board, role: BoardMemberRole): PublicBoard {
  return {
    id: board.id,
    title: board.title,
    color: board.color,
    role,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

export class BoardService {
  private get boards() {
    return AppDataSource.getRepository(Board);
  }

  private get members() {
    return AppDataSource.getRepository(BoardMember);
  }

  /** Boards the user owns, plus boards they were added to as an active member. */
  async list(userId: string): Promise<PublicBoard[]> {
    const owned = await this.boards.find({
      where: { ownerId: userId },
      order: { createdAt: "DESC" },
    });

    const memberships = await this.members.find({
      where: { userId, status: "active" },
      relations: { board: true },
      order: { createdAt: "DESC" },
    });

    const ownBoards = owned.map((board) => toPublicBoard(board, "admin"));
    const memberBoards = memberships.map((membership) =>
      toPublicBoard(membership.board, membership.role),
    );

    return [...ownBoards, ...memberBoards];
  }

  async findById(userId: string, boardId: string): Promise<PublicBoard> {
    const { board, role } = await this.getAccessibleBoard(userId, boardId);

    return toPublicBoard(board, role);
  }

  async create(
    ownerId: string,
    input: CreateBoardInput,
  ): Promise<PublicBoard> {
    const board = this.boards.create({
      title: input.title,
      color: input.color,
      ownerId,
    });

    await this.boards.save(board);

    return toPublicBoard(board, "admin");
  }

  async update(
    userId: string,
    boardId: string,
    input: UpdateBoardInput,
  ): Promise<PublicBoard> {
    const board = await this.requireAdmin(userId, boardId);

    if (input.title !== undefined) {
      board.title = input.title;
    }

    if (input.color !== undefined) {
      board.color = input.color;
    }

    await this.boards.save(board);

    return toPublicBoard(board, "admin");
  }

  /** Only the creator can delete the board itself, regardless of admin invites. */
  async remove(userId: string, boardId: string): Promise<void> {
    const { board } = await this.getAccessibleBoard(userId, boardId);

    if (board.ownerId !== userId) {
      throw new AppError("Apenas o criador do quadro pode excluí-lo.", 403);
    }

    await this.boards.remove(board);
  }

  /** The owner is always admin; other users need an active membership row. */
  async getAccessibleBoard(
    userId: string,
    boardId: string,
  ): Promise<{ board: Board; role: BoardMemberRole }> {
    const board = await this.boards.findOne({ where: { id: boardId } });

    if (!board) {
      throw new AppError("Quadro não encontrado.", 404);
    }

    if (board.ownerId === userId) {
      return { board, role: "admin" };
    }

    const member = await this.members.findOne({
      where: { boardId, userId, status: "active" },
    });

    if (!member) {
      throw new AppError("Quadro não encontrado.", 404);
    }

    return { board, role: member.role };
  }

  async requireAdmin(userId: string, boardId: string): Promise<Board> {
    const { board, role } = await this.getAccessibleBoard(userId, boardId);

    if (role !== "admin") {
      throw new AppError(
        "Apenas administradores do quadro podem realizar esta ação.",
        403,
      );
    }

    return board;
  }
}

export const boardService = new BoardService();
