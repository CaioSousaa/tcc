import { Repository } from "typeorm";
import { Comment } from "../entities/Comment";
import { Card } from "../entities/Card";

export class CommentService {
  constructor(
    private commentRepository: Repository<Comment>,
    private cardRepository: Repository<Card>
  ) {}

  async createComment(cardId: string, userId: string, content: string): Promise<Comment> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { list: { board: true } },
    });

    if (!card || card.list.board.userId !== userId) {
      throw new Error("Card not found");
    }

    if (!content.trim()) {
      throw new Error("Comment cannot be empty");
    }

    const comment = this.commentRepository.create({
      content,
      cardId,
      userId,
    });

    return this.commentRepository.save(comment);
  }

  async getComments(cardId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { cardId },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: { card: { list: { board: true } } },
    });

    if (!comment || (comment.card.list.board.userId !== userId && comment.userId !== userId)) {
      throw new Error("Comment not found");
    }

    await this.commentRepository.remove(comment);
  }
}
