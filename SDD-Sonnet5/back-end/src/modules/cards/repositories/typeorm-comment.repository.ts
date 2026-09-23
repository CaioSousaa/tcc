import { In, Repository } from "typeorm";
import { Comment } from "../entities/comment.entity";
import {
  CommentRepository,
  CommentWithAuthor,
  CreateCommentData,
} from "./comment.repository.types";

function toCommentWithAuthor(comment: Comment): CommentWithAuthor {
  return {
    id: comment.id,
    text: comment.text,
    cardId: comment.cardId,
    author: { id: comment.author.id, name: comment.author.name, email: comment.author.email },
    createdAt: comment.createdAt,
  };
}

export class TypeOrmCommentRepository implements CommentRepository {
  constructor(private readonly repo: Repository<Comment>) {}

  async create(data: CreateCommentData): Promise<CommentWithAuthor> {
    const comment = this.repo.create(data);
    const saved = await this.repo.save(comment);
    const withAuthor = await this.repo.findOneOrFail({
      where: { id: saved.id },
      relations: { author: true },
    });
    return toCommentWithAuthor(withAuthor);
  }

  async findAllByCardWithAuthor(cardId: string): Promise<CommentWithAuthor[]> {
    const rows = await this.repo.find({
      where: { cardId },
      relations: { author: true },
      order: { createdAt: "ASC" },
    });
    return rows.map(toCommentWithAuthor);
  }

  async deleteAllByCards(cardIds: string[]): Promise<number> {
    if (cardIds.length === 0) {
      return 0;
    }
    const result = await this.repo.delete({ cardId: In(cardIds) });
    return result.affected ?? 0;
  }
}
