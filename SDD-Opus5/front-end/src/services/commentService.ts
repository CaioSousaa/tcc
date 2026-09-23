import { api } from "@/lib/api";

export type CommentView = {
  id: string;
  author: { userId: string; name: string };
  body: string;
  /** ISO 8601 in UTC; formatted on the device (RF09 F129). */
  createdAt: string;
  edited: boolean;
};

const comments = (boardId: string, cardId: string, commentId?: string) => {
  const base = `/boards/${encodeURIComponent(boardId)}/cards/${encodeURIComponent(cardId)}/comments`;
  return commentId ? `${base}/${encodeURIComponent(commentId)}` : base;
};

// Every write answers with the whole history of the card (RF09 C228).
export const commentService = {
  async list(boardId: string, cardId: string): Promise<CommentView[]> {
    const { data } = await api.get<{ comments: CommentView[] }>(comments(boardId, cardId));
    return data.comments;
  },

  async create(boardId: string, cardId: string, body: string): Promise<{ comment: CommentView; comments: CommentView[] }> {
    const { data } = await api.post<{ comment: CommentView; comments: CommentView[] }>(comments(boardId, cardId), { body });
    return data;
  },

  async update(
    boardId: string,
    cardId: string,
    commentId: string,
    body: string,
  ): Promise<{ comment: CommentView; comments: CommentView[] }> {
    const { data } = await api.patch<{ comment: CommentView; comments: CommentView[] }>(comments(boardId, cardId, commentId), {
      body,
    });
    return data;
  },

  async remove(boardId: string, cardId: string, commentId: string): Promise<CommentView[]> {
    const { data } = await api.delete<{ comments: CommentView[] }>(comments(boardId, cardId, commentId));
    return data.comments;
  },
};
