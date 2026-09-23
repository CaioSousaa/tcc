import { Comment } from "../entities/Comment";
import { CommentRepository } from "../repositories/CommentRepository";
import { BoardMemberRepository } from "../repositories/BoardMemberRepository";
import { CardRepository } from "../repositories/CardRepository";
import { MemberRole, MemberStatus } from "../entities/BoardMember";
import { ValidationService } from "./ValidationService";

export class CommentService {
  private commentRepository: CommentRepository;
  private memberRepository: BoardMemberRepository;
  private cardRepository: CardRepository;
  private validationService: ValidationService;

  constructor() {
    this.commentRepository = new CommentRepository();
    this.memberRepository = new BoardMemberRepository();
    this.cardRepository = new CardRepository();
    this.validationService = new ValidationService();
  }

  async createComment(
    boardId: string,
    cardId: string,
    content: string,
    userId: string
  ): Promise<Comment> {
    const sanitized = (content || "").trim();

    if (sanitized.length < 1 || sanitized.length > 1000) {
      throw new Error("Comment must be between 1 and 1000 characters");
    }

    const card = await this.cardRepository.findByCardId(cardId);
    if (!card || card.list?.board_id !== boardId) {
      throw new Error("Card not found or does not belong to this board");
    }

    const member = await this.memberRepository.findByUserAndBoard(userId, boardId);
    if (!member || member.status !== MemberStatus.ACTIVE) {
      throw new Error("User is not an active member of this board");
    }

    const comment = await this.commentRepository.insert({
      card_id: cardId,
      user_id: userId,
      content: sanitized,
    });

    return comment;
  }

  async updateComment(
    boardId: string,
    cardId: string,
    commentId: string,
    content: string,
    userId: string
  ): Promise<Comment> {
    const sanitized = (content || "").trim();

    if (sanitized.length < 1 || sanitized.length > 1000) {
      throw new Error("Comment must be between 1 and 1000 characters");
    }

    const comment = await this.commentRepository.findById(commentId, cardId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new Error("Only comment author can edit");
    }

    const now = new Date();
    await this.commentRepository.update(commentId, cardId, {
      content: sanitized,
      updated_at: now,
      edited_at: now,
    });

    const updated = await this.commentRepository.findById(commentId, cardId);
    return updated!;
  }

  async deleteComment(
    boardId: string,
    cardId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const comment = await this.commentRepository.findById(commentId, cardId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const isAuthor = comment.user_id === userId;
    const userRole = await this.getMemberRole(boardId, userId);
    const canDeleteOther =
      userRole === MemberRole.ADMIN || userRole === MemberRole.EDITOR;

    if (!isAuthor && !canDeleteOther) {
      throw new Error("Only comment author or admin/editor can delete");
    }

    await this.commentRepository.delete(commentId, cardId);
  }

  async getCommentsOfCard(cardId: string): Promise<any[]> {
    const comments = await this.commentRepository.findByCardId(cardId);
    return comments.map((c) => ({
      id: c.id,
      author_name: c.user?.email || "Unknown",
      content: c.content,
      created_at: c.created_at,
      updated_at: c.updated_at,
      edited_at: c.edited_at,
    }));
  }

  async getCommentById(commentId: string, cardId: string): Promise<Comment | null> {
    return this.commentRepository.findById(commentId, cardId);
  }

  async getCommentCount(cardId: string): Promise<number> {
    return this.commentRepository.countByCardId(cardId);
  }

  private async getMemberRole(
    boardId: string,
    userId: string
  ): Promise<MemberRole | null> {
    const member = await this.memberRepository.findByUserAndBoard(userId, boardId);
    return member?.role || null;
  }
}
