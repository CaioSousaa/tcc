import { Repository } from "typeorm";
import { Comment } from "../entities/Comment";
import { AppDataSource } from "../database";

export class CommentRepository {
  private repo: Repository<Comment>;

  constructor() {
    this.repo = AppDataSource.getRepository(Comment);
  }

  async insert(comment: Partial<Comment>): Promise<Comment> {
    const newComment = this.repo.create(comment);
    return this.repo.save(newComment);
  }

  async findByCardId(cardId: string): Promise<Comment[]> {
    return this.repo.find({
      where: { card_id: cardId },
      relations: { user: true },
      order: { created_at: "ASC" },
    });
  }

  async findById(commentId: string, cardId: string): Promise<Comment | null> {
    return this.repo.findOne({
      where: { id: commentId, card_id: cardId },
      relations: { user: true },
    });
  }

  async update(
    commentId: string,
    cardId: string,
    data: Partial<Comment>
  ): Promise<void> {
    await this.repo.update(
      { id: commentId, card_id: cardId },
      data
    );
  }

  async delete(commentId: string, cardId: string): Promise<void> {
    await this.repo.delete({ id: commentId, card_id: cardId });
  }

  async countByCardId(cardId: string): Promise<number> {
    return this.repo.count({ where: { card_id: cardId } });
  }

  async deleteByCardId(cardId: string): Promise<void> {
    await this.repo.delete({ card_id: cardId });
  }
}
