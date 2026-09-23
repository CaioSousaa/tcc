import { v4 as uuidv4 } from "uuid";
import { ColumnRepository } from "../repositories/ColumnRepository";
import { BoardRepository } from "../repositories/BoardRepository";
import { CardRepository } from "../repositories/CardRepository";
import { ValidationService } from "./ValidationService";
import { BoardColumn } from "../entities/Column";

export class ColumnService {
  private columnRepository: ColumnRepository;
  private boardRepository: BoardRepository;
  private cardRepository: CardRepository;
  private validationService: ValidationService;

  constructor() {
    this.columnRepository = new ColumnRepository();
    this.boardRepository = new BoardRepository();
    this.cardRepository = new CardRepository();
    this.validationService = new ValidationService();
  }

  async createColumn(boardId: string, userId: string, name: string): Promise<BoardColumn> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    const sanitizedName = this.validationService.sanitizeColumnName(name);

    if (!this.validationService.validateColumnName(sanitizedName)) {
      throw new Error("Nome não pode estar vazio");
    }

    if (sanitizedName.length > 100) {
      throw new Error("Nome muito longo (máximo 100 caracteres)");
    }

    const isDuplicate = await this.columnRepository.checkNameDuplicate(boardId, sanitizedName);
    if (isDuplicate) {
      throw new Error("Já existe uma lista com este nome neste quadro");
    }

    const columnCount = await this.columnRepository.countByBoard(boardId);

    const column = await this.columnRepository.insert({
      id: uuidv4(),
      board_id: boardId,
      name: sanitizedName,
      position: columnCount,
    });

    return column;
  }

  async getColumnsByBoard(boardId: string, userId: string): Promise<BoardColumn[]> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    return this.columnRepository.findByBoard(boardId);
  }

  async updateColumn(
    columnId: string,
    boardId: string,
    userId: string,
    { name }: { name: string }
  ): Promise<BoardColumn> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    const column = await this.columnRepository.findById(columnId, boardId);
    if (!column) {
      throw new Error("Lista não encontrada");
    }

    const sanitizedName = this.validationService.sanitizeColumnName(name);

    if (!this.validationService.validateColumnName(sanitizedName)) {
      throw new Error("Nome não pode estar vazio");
    }

    if (sanitizedName.length > 100) {
      throw new Error("Nome muito longo (máximo 100 caracteres)");
    }

    if (sanitizedName !== column.name) {
      const isDuplicate = await this.columnRepository.checkNameDuplicate(
        boardId,
        sanitizedName,
        columnId
      );
      if (isDuplicate) {
        throw new Error("Já existe uma lista com este nome neste quadro");
      }
    }

    await this.columnRepository.update(columnId, boardId, { name: sanitizedName });

    const updatedColumn = await this.columnRepository.findById(columnId, boardId);
    if (!updatedColumn) {
      throw new Error("Erro ao atualizar lista");
    }

    return updatedColumn;
  }

  async reorderColumns(
    boardId: string,
    userId: string,
    columnsData: Array<{ id: string; position: number }>
  ): Promise<BoardColumn[]> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    const columnCount = await this.columnRepository.countByBoard(boardId);

    const positions = columnsData.map((c) => c.position);
    const validPositions = Array.from({ length: columnCount }, (_, i) => i);

    if (
      positions.length !== columnCount ||
      !positions.every((p) => validPositions.includes(p))
    ) {
      throw new Error("Posições inválidas");
    }

    await this.columnRepository.updatePositions(boardId, columnsData);

    return this.columnRepository.findByBoard(boardId);
  }

  async deleteColumn(columnId: string, boardId: string, userId: string): Promise<void> {
    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Quadro não encontrado");
    }

    const column = await this.columnRepository.findById(columnId, boardId);
    if (!column) {
      throw new Error("Lista não encontrada");
    }

    await this.columnRepository.delete(columnId, boardId);

    const remainingColumns = await this.columnRepository.findByBoard(boardId);
    const reorderedColumns = remainingColumns.map((col, index) => ({
      id: col.id,
      position: index,
    }));

    if (reorderedColumns.length > 0) {
      await this.columnRepository.updatePositions(boardId, reorderedColumns);
    }
  }
}
