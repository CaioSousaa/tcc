export interface CreateCommentData {
  cardId: string;
  authorId: string;
  text: string;
}

export interface AuthorInfo {
  id: string;
  name: string;
  email: string;
}

export interface CommentWithAuthor {
  id: string;
  text: string;
  cardId: string;
  author: AuthorInfo;
  createdAt: Date;
}

export interface CommentRepository {
  create(data: CreateCommentData): Promise<CommentWithAuthor>;
  findAllByCardWithAuthor(cardId: string): Promise<CommentWithAuthor[]>;
  deleteAllByCards(cardIds: string[]): Promise<number>;
}
