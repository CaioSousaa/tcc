import { v4 as uuidv4 } from "uuid";
import { CardRepository } from "../repositories/CardRepository";
import { BoardRepository } from "../repositories/BoardRepository";
import { ColumnRepository } from "../repositories/ColumnRepository";
import { ValidationService } from "./ValidationService";
import { Card } from "../entities/Card";

export class CardService {
  private cardRepository: CardRepository;
  private boardRepository: BoardRepository;
  private columnRepository: ColumnRepository;
  private validationService: ValidationService;

  constructor() {
    this.cardRepository = new CardRepository();
    this.boardRepository = new BoardRepository();
    this.columnRepository = new ColumnRepository();
    this.validationService = new ValidationService();
  }

  async createCard(
    listId: string,
    userId: string,
    title: string,
    description?: string
  ): Promise<Card> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    const board = await this.boardRepository.findByIdOnly(list.board_id);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    const sanitizedTitle = this.validationService.sanitizeCardTitle(title);
    const sanitizedDescription = this.validationService.sanitizeCardDescription(
      description
    );

    if (!this.validationService.validateCardTitle(sanitizedTitle)) {
      throw new Error("Título não pode estar vazio");
    }

    if (sanitizedTitle.length > 255) {
      throw new Error("Título muito longo (máximo 255 caracteres)");
    }

    if (!this.validationService.validateCardDescription(sanitizedDescription)) {
      throw new Error("Descrição muito longa (máximo 5000 caracteres)");
    }

    const cardCount = await this.cardRepository.countByList(listId);

    const card = await this.cardRepository.insert({
      id: uuidv4(),
      list_id: listId,
      title: sanitizedTitle,
      description: sanitizedDescription || null,
      position: cardCount,
    });

    return card;
  }

  async getCardsByList(listId: string, userId: string): Promise<Card[]> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    const board = await this.boardRepository.findByIdOnly(list.board_id);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    return this.cardRepository.findByList(listId);
  }

  async updateCard(
    cardId: string,
    listId: string,
    userId: string,
    { title, description }: { title?: string; description?: string }
  ): Promise<Card> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    const board = await this.boardRepository.findByIdOnly(list.board_id);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    const card = await this.cardRepository.findById(cardId, listId);
    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    const updateData: Partial<Card> = {};

    if (title !== undefined) {
      const sanitizedTitle = this.validationService.sanitizeCardTitle(title);

      if (!this.validationService.validateCardTitle(sanitizedTitle)) {
        throw new Error("Título não pode estar vazio");
      }

      if (sanitizedTitle.length > 255) {
        throw new Error("Título muito longo (máximo 255 caracteres)");
      }

      updateData.title = sanitizedTitle;
    }

    if (description !== undefined) {
      const sanitizedDescription =
        this.validationService.sanitizeCardDescription(description);

      if (!this.validationService.validateCardDescription(sanitizedDescription)) {
        throw new Error("Descrição muito longa (máximo 5000 caracteres)");
      }

      updateData.description = sanitizedDescription || null;
    }

    if (Object.keys(updateData).length > 0) {
      await this.cardRepository.update(cardId, listId, updateData);
    }

    const updatedCard = await this.cardRepository.findById(cardId, listId);
    if (!updatedCard) {
      throw new Error("Erro ao atualizar cartão");
    }

    return updatedCard;
  }

  async moveCard(
    cardId: string,
    fromListId: string,
    userId: string,
    { toListId, position }: { toListId: string; position: number }
  ): Promise<Card> {
    const fromList = await this.columnRepository.findById(fromListId, "");
    if (!fromList) {
      throw new Error("Lista de origem não encontrada");
    }

    const toList = await this.columnRepository.findById(toListId, "");
    if (!toList) {
      throw new Error("Lista de destino não encontrada");
    }

    const board = await this.boardRepository.findByIdOnly(fromList.board_id);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    if (toList.board_id !== fromList.board_id) {
      throw new Error("Listas pertencem a quadros diferentes");
    }

    const card = await this.cardRepository.findById(cardId, fromListId);
    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    const toListCardCount = await this.cardRepository.countByList(toListId);

    if (position < 0 || position > toListCardCount) {
      throw new Error("Posição inválida");
    }

    if (fromListId === toListId) {
      const cardsInList = await this.cardRepository.findByList(fromListId);
      const currentPosition = cardsInList.findIndex((c) => c.id === cardId);

      if (currentPosition === position) {
        return card;
      }

      const updatedCards = cardsInList
        .filter((c) => c.id !== cardId)
        .map((c, idx) => ({
          id: c.id,
          position: idx < position ? idx : idx + 1,
        }));

      updatedCards.splice(position, 0, { id: cardId, position });
      const finalCards = updatedCards.map((c, idx) => ({
        ...c,
        position: idx,
      }));

      await this.cardRepository.updatePositions(fromListId, finalCards);
    } else {
      const fromListCards = await this.cardRepository.findByList(fromListId);
      const toListCards = await this.cardRepository.findByList(toListId);

      const fromUpdated = fromListCards
        .filter((c) => c.id !== cardId)
        .map((c, idx) => ({
          id: c.id,
          position: idx,
        }));

      const toUpdated = toListCards
        .map((c, idx) => ({
          id: c.id,
          position: idx >= position ? idx + 1 : idx,
        }))
        .concat([{ id: cardId, position }]);

      const toFinal = toUpdated.map((c, idx) => ({
        ...c,
        position: idx,
      }));

      await this.cardRepository.updatePositions(fromListId, fromUpdated);
      await this.cardRepository.moveCard(cardId, fromListId, toListId, position);
      await this.cardRepository.updatePositions(toListId, toFinal);
    }

    const updatedCard = await this.cardRepository.findById(cardId, toListId);
    if (!updatedCard) {
      throw new Error("Erro ao mover cartão");
    }

    return updatedCard;
  }

  async deleteCard(cardId: string, listId: string, userId: string): Promise<void> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    const board = await this.boardRepository.findByIdOnly(list.board_id);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    const card = await this.cardRepository.findById(cardId, listId);
    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    await this.cardRepository.delete(cardId, listId);

    const remainingCards = await this.cardRepository.findByList(listId);
    const reorderedCards = remainingCards.map((c, index) => ({
      id: c.id,
      position: index,
    }));

    if (reorderedCards.length > 0) {
      await this.cardRepository.updatePositions(listId, reorderedCards);
    }
  }

  async setDueDate(
    boardId: string,
    cardId: string,
    listId: string,
    dueDate: string,
    userId: string
  ): Promise<Card> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    if (list.board_id !== boardId) {
      throw new Error("Lista não pertence ao quadro");
    }

    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    const card = await this.cardRepository.findById(cardId, listId);
    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    if (!this.validationService.validateDateFormat(dueDate)) {
      throw new Error("Data inválida");
    }

    const dueDateObj = new Date(dueDate);
    await this.cardRepository.updateDueDate(cardId, listId, dueDateObj);

    const updatedCard = await this.cardRepository.findById(cardId, listId);
    if (!updatedCard) {
      throw new Error("Erro ao atualizar data de vencimento");
    }

    return updatedCard;
  }

  async removeDueDate(
    boardId: string,
    cardId: string,
    listId: string,
    userId: string
  ): Promise<void> {
    const list = await this.columnRepository.findByIdOnly(listId);
    if (!list) {
      throw new Error("Lista não encontrada");
    }

    if (list.board_id !== boardId) {
      throw new Error("Lista não pertence ao quadro");
    }

    const board = await this.boardRepository.findByIdOnly(boardId);
    if (!board || board.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    const card = await this.cardRepository.findById(cardId, listId);
    if (!card) {
      throw new Error("Cartão não encontrado");
    }

    await this.cardRepository.removeDueDate(cardId, listId);
  }

  calculateDueStatus(dueDate: Date | null): "no_due" | "due_today" | "due_soon" | "overdue" {
    if (!dueDate) {
      return "no_due";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);

    const diffTime = dueDateOnly.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "overdue";
    } else if (diffDays === 0) {
      return "due_today";
    } else if (diffDays <= 7) {
      return "due_soon";
    } else {
      return "no_due";
    }
  }

  async getCardsByDueFilter(
    boardId: string,
    filter: "overdue" | "due_today" | "next_7_days" | "next_30_days" | "no_due"
  ): Promise<Card[]> {
    return this.cardRepository.findByDueFilter(boardId, filter);
  }
}
