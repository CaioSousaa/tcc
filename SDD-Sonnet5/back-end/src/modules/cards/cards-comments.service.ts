import { BoardNotFoundError } from "../boards/boards.errors";
import { BoardRepository } from "../boards/repositories/repository.types";
import { ListNotFoundError } from "../lists/lists.errors";
import { ListRepository } from "../lists/repositories/repository.types";
import { CardNotFoundError } from "./cards.errors";
import { CreateCommentInput } from "./cards-comments.schemas";
import { CardRepository } from "./repositories/repository.types";
import { CommentRepository, CommentWithAuthor } from "./repositories/comment.repository.types";

export class CardsCommentsService {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cardRepository: CardRepository,
    private readonly listRepository: ListRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async create(
    userId: string,
    boardId: string,
    listId: string,
    cardId: string,
    input: CreateCommentInput,
  ): Promise<CommentWithAuthor> {
    await this.resolveCard(userId, boardId, listId, cardId);
    return this.commentRepository.create({ cardId, authorId: userId, text: input.text });
  }

  async list(
    userId: string,
    boardId: string,
    listId: string,
    cardId: string,
  ): Promise<CommentWithAuthor[]> {
    await this.resolveCard(userId, boardId, listId, cardId);
    return this.commentRepository.findAllByCardWithAuthor(cardId);
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
