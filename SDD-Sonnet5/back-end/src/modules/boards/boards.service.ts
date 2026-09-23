import { BoardNotFoundError } from "./boards.errors";
import { ForbiddenRoleError } from "./boards-members.errors";
import { CreateBoardInput, UpdateBoardInput } from "./boards.schemas";
import { Board } from "./entities/board.entity";
import { BoardMemberRole } from "./entities/board-member.entity";
import { BoardRepository } from "./repositories/repository.types";
import { BoardMemberRepository } from "./repositories/board-member.repository.types";

export interface BoardWithRole {
  board: Board;
  role: BoardMemberRole;
}

export class BoardsService {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly boardMemberRepository: BoardMemberRepository,
  ) {}

  /**
   * Cria o quadro e a membership inicial do criador como administrador (RN-02).
   * Sem transação de banco disponível na camada de repositório deste projeto (cada
   * repositório encapsula uma única entidade), a atomicidade é obtida por compensação:
   * se a membership não puder ser criada, o quadro recém-criado é desfeito, evitando
   * um quadro persistido sem nenhum administrador.
   */
  async create(ownerId: string, input: CreateBoardInput): Promise<BoardWithRole> {
    const board = await this.boardRepository.create({
      ownerId,
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
    });

    try {
      await this.boardMemberRepository.create({
        boardId: board.id,
        userId: ownerId,
        role: "administrador",
      });
    } catch (err) {
      await this.boardRepository.deleteById(board.id);
      throw err;
    }

    return { board, role: "administrador" };
  }

  async list(userId: string): Promise<BoardWithRole[]> {
    const [boards, memberships] = await Promise.all([
      this.boardRepository.findAllByMember(userId),
      this.boardMemberRepository.findAllByUserId(userId),
    ]);

    const roleByBoardId = new Map(memberships.map((m) => [m.boardId, m.role]));
    return boards.map((board) => ({
      board,
      role: roleByBoardId.get(board.id) as BoardMemberRole,
    }));
  }

  async getById(userId: string, boardId: string): Promise<BoardWithRole> {
    const board = await this.boardRepository.findByIdAndMember(boardId, userId);
    if (!board) {
      throw new BoardNotFoundError();
    }
    const role = await this.roleOf(boardId, userId);
    return { board, role };
  }

  async update(userId: string, boardId: string, input: UpdateBoardInput): Promise<BoardWithRole> {
    const board = await this.boardRepository.updateByIdAndMember(boardId, userId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
    if (!board) {
      throw new BoardNotFoundError();
    }
    const role = await this.roleOf(boardId, userId);
    return { board, role };
  }

  async remove(userId: string, boardId: string): Promise<void> {
    const membership = await this.boardMemberRepository.findByBoardAndUser(boardId, userId);
    if (!membership) {
      throw new BoardNotFoundError();
    }
    if (membership.role !== "administrador") {
      throw new ForbiddenRoleError();
    }

    const deleted = await this.boardRepository.deleteById(boardId);
    if (!deleted) {
      throw new BoardNotFoundError();
    }
  }

  private async roleOf(boardId: string, userId: string): Promise<BoardMemberRole> {
    const membership = await this.boardMemberRepository.findByBoardAndUser(boardId, userId);
    if (!membership) {
      throw new BoardNotFoundError();
    }
    return membership.role;
  }
}
