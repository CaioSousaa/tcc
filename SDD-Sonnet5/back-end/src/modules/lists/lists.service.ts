import { ValidationError } from "../../shared/errors";
import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { CardRepository } from "../cards/repositories/repository.types";
import { CommentRepository } from "../cards/repositories/comment.repository.types";
import { ChecklistRepository } from "../checklists/repositories/repository.types";
import { ListNotFoundError } from "./lists.errors";
import { CreateListInput, UpdateListInput } from "./lists.schemas";
import { List } from "./entities/list.entity";
import { ListRepository } from "./repositories/repository.types";

export class ListsService {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
    private readonly cardRepository: CardRepository,
    private readonly checklistRepository: ChecklistRepository,
    private readonly commentRepository: CommentRepository,
  ) {}

  async create(ownerId: string, boardId: string, input: CreateListInput): Promise<List> {
    await this.assertBoardOwnership(ownerId, boardId);
    return this.listRepository.create({ boardId, name: input.name });
  }

  async list(ownerId: string, boardId: string): Promise<List[]> {
    await this.assertBoardOwnership(ownerId, boardId);
    return this.listRepository.findAllByBoard(boardId);
  }

  async update(
    ownerId: string,
    boardId: string,
    listId: string,
    input: UpdateListInput,
  ): Promise<List> {
    await this.assertBoardOwnership(ownerId, boardId);

    const current = await this.listRepository.findByIdAndBoard(listId, boardId);
    if (!current) {
      throw new ListNotFoundError();
    }

    if (input.position !== undefined) {
      const total = await this.listRepository.countByBoard(boardId);
      const maxIndex = total - 1;
      if (input.position > maxIndex) {
        throw new ValidationError({
          position: `position must be between 0 and ${maxIndex} for this board`,
        });
      }
    }

    const updated = await this.listRepository.update(listId, boardId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    });
    if (!updated) {
      throw new ListNotFoundError();
    }
    return updated;
  }

  async remove(ownerId: string, boardId: string, listId: string): Promise<void> {
    await this.assertBoardOwnership(ownerId, boardId);

    const list = await this.listRepository.findByIdAndBoard(listId, boardId);
    if (!list) {
      throw new ListNotFoundError();
    }

    const cardsOfList = await this.cardRepository.findAllByList(listId);
    if (cardsOfList.length > 0) {
      const cardIds = cardsOfList.map((card) => card.id);
      await this.checklistRepository.deleteAllByCards(cardIds);
      await this.commentRepository.deleteAllByCards(cardIds);
    }

    await this.cardRepository.deleteAllByList(listId);

    const deleted = await this.listRepository.delete(listId, boardId);
    if (!deleted) {
      throw new ListNotFoundError();
    }
  }

  private async assertBoardOwnership(ownerId: string, boardId: string): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, ownerId);
    if (!board) {
      throw new BoardNotFoundError();
    }
  }
}
