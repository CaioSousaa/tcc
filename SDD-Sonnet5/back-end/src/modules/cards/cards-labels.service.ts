import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { ListRepository } from "../lists/repositories/repository.types";
import { LabelNotFoundError } from "../labels/labels.errors";
import { Label } from "../labels/entities/label.entity";
import { LabelRepository } from "../labels/repositories/repository.types";
import { CardLabelNotFoundError } from "./cards-labels.errors";
import { CardNotFoundError } from "./cards.errors";
import { CardRepository } from "./repositories/repository.types";
import { CardLabelRepository } from "./repositories/card-label.repository.types";

export class CardsLabelsService {
  constructor(
    private readonly cardLabelRepository: CardLabelRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
    private readonly labelRepository: LabelRepository,
  ) {}

  async associate(
    userId: string,
    boardId: string,
    listId: string,
    cardId: string,
    labelId: string,
  ): Promise<Label> {
    await this.resolveCard(userId, boardId, listId, cardId);

    const label = await this.labelRepository.findByIdAndBoard(labelId, boardId);
    if (!label) {
      throw new LabelNotFoundError();
    }

    await this.cardLabelRepository.create({ cardId, labelId });

    return label;
  }

  async dissociate(
    userId: string,
    boardId: string,
    listId: string,
    cardId: string,
    labelId: string,
  ): Promise<void> {
    await this.resolveCard(userId, boardId, listId, cardId);

    const deleted = await this.cardLabelRepository.delete(cardId, labelId);
    if (!deleted) {
      throw new CardLabelNotFoundError();
    }
  }

  private async resolveCard(
    userId: string,
    boardId: string,
    listId: string,
    cardId: string,
  ): Promise<void> {
    const board = await this.boardRepository.findByIdAndMember(boardId, userId);
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
}
