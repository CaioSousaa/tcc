import { Comment } from "./entities/Comment";

export interface CommentView {
  id: string;
  text: string;
  edited: boolean;
  cardId: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: Date;
}

export function toCommentView(comment: Comment): CommentView {
  return {
    id: comment.id,
    text: comment.text,
    edited: comment.edited,
    cardId: comment.cardId,
    authorId: comment.authorId,
    authorName: comment.author?.name ?? null,
    authorEmail: comment.author?.email ?? null,
    createdAt: comment.createdAt,
  };
}
