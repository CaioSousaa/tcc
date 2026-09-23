import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { ListRepository } from "../lists/repositories/repository.types";
import { CardNotFoundError } from "../cards/cards.errors";
import { CardRepository } from "../cards/repositories/repository.types";
import { ChecklistNotFoundError, ItemNotFoundError } from "./checklists.errors";
import { CreateChecklistInput, CreateItemInput, UpdateItemInput } from "./checklists.schemas";
import { Checklist } from "./entities/checklist.entity";
import { ChecklistItem } from "./entities/checklist-item.entity";
import { ChecklistRepository, ChecklistWithItems } from "./repositories/repository.types";

export class ChecklistsService {
  constructor(
    private readonly checklistRepository: ChecklistRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async createChecklist(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    input: CreateChecklistInput,
  ): Promise<Checklist> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    return this.checklistRepository.createChecklist({ cardId, name: input.name });
  }

  async listChecklists(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
  ): Promise<ChecklistWithItems[]> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    return this.checklistRepository.findAllByCardWithItems(cardId);
  }

  async deleteChecklist(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    checklistId: string,
  ): Promise<void> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    const deleted = await this.checklistRepository.deleteChecklist(checklistId, cardId);
    if (!deleted) {
      throw new ChecklistNotFoundError();
    }
  }

  async createItem(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    checklistId: string,
    input: CreateItemInput,
  ): Promise<ChecklistItem> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    await this.resolveChecklist(cardId, checklistId);
    return this.checklistRepository.createItem({ checklistId, text: input.text });
  }

  async updateItem(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    input: UpdateItemInput,
  ): Promise<ChecklistItem> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    await this.resolveChecklist(cardId, checklistId);

    const updated = await this.checklistRepository.updateItemCompleted(
      itemId,
      checklistId,
      input.completed,
    );
    if (!updated) {
      throw new ItemNotFoundError();
    }
    return updated;
  }

  async deleteItem(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
  ): Promise<void> {
    await this.resolveCard(ownerId, boardId, listId, cardId);
    await this.resolveChecklist(cardId, checklistId);

    const deleted = await this.checklistRepository.deleteItem(itemId, checklistId);
    if (!deleted) {
      throw new ItemNotFoundError();
    }
  }

  private async resolveCard(
    ownerId: string,
    boardId: string,
    listId: string,
    cardId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, ownerId);
    if (!board) {
      throw new BoardNotFoundError();
    }

    const list = await this.listRepository.findByIdAndBoard(listId, boardId);
    if (!list) {
      throw new ListNotFoundError();
    }

    const card = await this.cardRepository.findByIdAndList(cardId, listId);
    if (!card) {
      throw new CardNotFoundError();
    }
  }

  private async resolveChecklist(cardId: string, checklistId: string): Promise<void> {
    const checklist = await this.checklistRepository.findChecklistByIdAndCard(
      checklistId,
      cardId,
    );
    if (!checklist) {
      throw new ChecklistNotFoundError();
    }
  }
}
