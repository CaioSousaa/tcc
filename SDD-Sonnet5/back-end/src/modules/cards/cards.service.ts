import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { ListRepository } from "../lists/repositories/repository.types";
import { CardProgress, ChecklistRepository } from "../checklists/repositories/repository.types";
import { CardNotFoundError } from "./cards.errors";
import { CreateCardInput, UpdateCardInput } from "./cards.schemas";
import { Card } from "./entities/card.entity";
import { CardRepository, UpdateCardFields } from "./repositories/repository.types";
import { AssigneeInfo, CardAssignmentRepository } from "./repositories/card-assignment.repository.types";
import { CardLabelRepository, LabelInfo } from "./repositories/card-label.repository.types";
import { CommentRepository } from "./repositories/comment.repository.types";

/** Ordenação estável: prazo mais próximo primeiro; sem prazo sempre por último (RF10, RN-11, RN-12). */
function compareByDueDate(a: Card, b: Card): number {
  if (a.dueDate === b.dueDate) {
    return 0;
  }
  if (a.dueDate === null) {
    return 1;
  }
  if (b.dueDate === null) {
    return -1;
  }
  return a.dueDate < b.dueDate ? -1 : 1;
}

export class CardsService {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly cardAssignmentRepository: CardAssignmentRepository,
    private readonly cardLabelRepository: CardLabelRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  /** Leitura agregada de progresso (RF06, RN-13) — nunca escreve em checklists/itens. */
  async getProgressForCards(cardIds: string[]): Promise<Record<string, CardProgress>> {
    return this.checklistRepository.getProgressByCards(cardIds);
  }

  /** Leitura agregada de responsáveis (RF07, RN-11) — nunca escreve em card_assignments. */
  async getAssigneesForCards(cardIds: string[]): Promise<Record<string, AssigneeInfo[]>> {
    return this.cardAssignmentRepository.findAllByCardIds(cardIds);
  }

  /** Leitura agregada de etiquetas (RF08, critério 24) — nunca escreve em card_labels. */
  async getLabelsForCards(cardIds: string[]): Promise<Record<string, LabelInfo[]>> {
    return this.cardLabelRepository.findAllByCardIds(cardIds);
  }

  async create(
    ownerId: string,
    boardId: string,
    listId: string,
    input: CreateCardInput,
  ): Promise<Card> {
    await this.resolveListInBoard(ownerId, boardId, listId);
    return this.cardRepository.create({
      listId,
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    });
  }

  async list(
    ownerId: string,
    boardId: string,
    listId: string,
    labelIds?: string[],
    sortByDueDate?: boolean,
  ): Promise<Card[]> {
    await this.resolveListInBoard(ownerId, boardId, listId);
    const cards = await this.cardRepository.findAllByList(listId);

    let result = cards;
    if (labelIds && labelIds.length > 0) {
      const matchingIds = await this.cardLabelRepository.filterCardIdsByLabels(
        cards.map((card) => card.id),
        labelIds,
      );
      result = cards.filter((card) => matchingIds.has(card.id));
    }

    if (sortByDueDate) {
      result = [...result].sort(compareByDueDate);
    }

    return result;
  }

  async update(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    input: UpdateCardInput,
  ): Promise<Card> {
    await this.resolveListInBoard(ownerId, boardId, listId);

    const current = await this.cardRepository.findByIdAndList(cardId, listId);
    if (!current) {
      throw new CardNotFoundError();
    }

    const fields: UpdateCardFields = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    };

    if (input.targetListId !== undefined && input.targetListId !== listId) {
      const targetListId = input.targetListId;
      await this.resolveListInBoard(ownerId, boardId, targetListId);

      const moved = await this.cardRepository.move(cardId, listId, targetListId, fields);
      if (!moved) {
        throw new CardNotFoundError();
      }
      return moved;
    }

    const updated = await this.cardRepository.update(cardId, listId, fields);
    if (!updated) {
      throw new CardNotFoundError();
    }
    return updated;
  }

  async remove(ownerId: string, boardId: string, listId: string, cardId: string): Promise<void> {
    await this.resolveListInBoard(ownerId, boardId, listId);

    const card = await this.cardRepository.findByIdAndList(cardId, listId);
    if (!card) {
      throw new CardNotFoundError();
    }

    await this.checklistRepository.deleteAllByCards([cardId]);
    await this.commentRepository.deleteAllByCards([cardId]);

    const deleted = await this.cardRepository.delete(cardId, listId);
    if (!deleted) {
      throw new CardNotFoundError();
    }
  }

  private async resolveListInBoard(
    ownerId: string,
    boardId: string,
    listId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, ownerId);
    if (!board) {
      throw new BoardNotFoundError();
    }

    const list = await this.listRepository.findByIdAndBoard(listId, boardId);
    if (!list) {
      throw new ListNotFoundError();
    }
  }
}
