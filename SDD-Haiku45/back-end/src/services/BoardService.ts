import { v4 as uuidv4 } from "uuid";
import { BoardRepository } from "../repositories/BoardRepository";
import { ColumnRepository } from "../repositories/ColumnRepository";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { MemberRole, MemberStatus } from "../entities/BoardMember";
import { ValidationService } from "./ValidationService";
import { Board } from "../entities/Board";
import { BoardColumn } from "../entities/Column";

export class BoardService {
  private boardRepository: BoardRepository;
  private columnRepository: ColumnRepository;
  private boardMemberRepository: BoardMemberRepository;
  private validationService: ValidationService;

  constructor() {
    this.boardRepository = new BoardRepository();
    this.columnRepository = new ColumnRepository();
    this.boardMemberRepository = new BoardMemberRepository();
    this.validationService = new ValidationService();
  }

  async createBoard(userId: string, name: string): Promise<Board> {
    const sanitizedName = this.validationService.sanitizeBoardName(name);

    if (!this.validationService.validateBoardName(sanitizedName)) {
      throw new Error("Nome não pode estar vazio");
    }

    if (sanitizedName.length > 100) {
      throw new Error("Nome muito longo (máximo 100 caracteres)");
    }

    const isDuplicate = await this.boardRepository.checkNameDuplicate(userId, sanitizedName);
    if (isDuplicate) {
      throw new Error("Já existe quadro com este nome");
    }

    const board = await this.boardRepository.insert({
      id: uuidv4(),
      user_id: userId,
      name: sanitizedName,
    });

    await this.boardMemberRepository.insert({
      id: uuidv4(),
      board_id: board.id,
      user_id: userId,
      role: MemberRole.ADMIN,
      status: MemberStatus.ACTIVE,
      accepted_at: new Date(),
    });

    board.columns = [];
    return board;
  }

  async getBoardsList(userId: string): Promise<Board[]> {
    return this.boardRepository.findByUser(userId);
  }

  async getBoard(boardId: string, userId: string): Promise<Board> {
    const board = await this.boardRepository.findById(boardId, userId);
    if (!board) {
      throw new Error("Quadro não encontrado");
    }
    return board;
  }

  async updateBoard(
    boardId: string,
    userId: string,
    { name }: { name: string }
  ): Promise<Board> {
    const sanitizedName = this.validationService.sanitizeBoardName(name);

    if (!this.validationService.validateBoardName(sanitizedName)) {
      throw new Error("Nome não pode estar vazio");
    }

    if (sanitizedName.length > 100) {
      throw new Error("Nome muito longo (máximo 100 caracteres)");
    }

    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    if (sanitizedName !== board.name) {
      const isDuplicate = await this.boardRepository.checkNameDuplicate(
        userId,
        sanitizedName,
        boardId
      );
      if (isDuplicate) {
        throw new Error("Já existe quadro com este nome");
      }
    }

    await this.boardRepository.update(boardId, userId, { name: sanitizedName });

    const updatedBoard = await this.boardRepository.findById(boardId, userId);
    if (!updatedBoard) {
      throw new Error("Erro ao atualizar quadro");
    }

    return updatedBoard;
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    await this.boardRepository.delete(boardId, userId);
  }
}
