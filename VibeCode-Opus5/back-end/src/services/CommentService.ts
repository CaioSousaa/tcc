import { AppDataSource } from "../data-source";
import { Card } from "../entities/Card";
import { Comment } from "../entities/Comment";
import { List } from "../entities/List";
import type { CreateCommentInput } from "../schemas/comment.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicComment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
}

function toPublicComment(comment: Comment): PublicComment {
  return {
    id: comment.id,
    cardId: comment.cardId,
    authorId: comment.authorId,
    authorName: comment.author?.name ?? "Usuário",
    body: comment.body,
    createdAt: comment.createdAt,
  };
}

export class CommentService {
  private get comments() {
    return AppDataSource.getRepository(Comment);
  }

  async list(userId: string, boardId: string): Promise<PublicComment[]> {
    await boardService.getAccessibleBoard(userId, boardId);

    const rows = await this.comments
      .createQueryBuilder("comment")
      .innerJoin(Card, "card", "card.id = comment.card_id")
      .innerJoin(List, "list", "list.id = card.list_id")
      .leftJoinAndSelect("comment.author", "author")
      .where("list.board_id = :boardId", { boardId })
      .orderBy("comment.created_at", "ASC")
      .getMany();

    return rows.map(toPublicComment);
  }

  async create(
    userId: string,
    boardId: string,
    input: CreateCommentInput,
  ): Promise<PublicComment> {
    await boardService.getAccessibleBoard(userId, boardId);
    await this.getBoardCard(boardId, input.cardId);

    const comment = this.comments.create({
      cardId: input.cardId,
      authorId: userId,
      body: input.body,
    });

    await this.comments.save(comment);

    const withAuthor = await this.comments.findOne({
      where: { id: comment.id },
      relations: { author: true },
    });

    return toPublicComment(withAuthor!);
  }

  async remove(
    userId: string,
    boardId: string,
    commentId: string,
  ): Promise<void> {
    const { role } = await boardService.getAccessibleBoard(userId, boardId);

    const comment = await this.comments.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new AppError("Comentário não encontrado.", 404);
    }

    await this.getBoardCard(boardId, comment.cardId);

    if (comment.authorId !== userId && role !== "admin") {
      throw new AppError(
        "Você só pode excluir os seus próprios comentários.",
        403,
      );
    }

    await this.comments.remove(comment);
  }

  private async getBoardCard(boardId: string, cardId: string): Promise<Card> {
    const card = await AppDataSource.getRepository(Card).findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new AppError("Card não encontrado.", 404);
    }

    const list = await AppDataSource.getRepository(List).findOne({
      where: { id: card.listId },
    });

    if (!list || list.boardId !== boardId) {
      throw new AppError("Card não encontrado.", 404);
    }

    return card;
  }
}

export const commentService = new CommentService();
