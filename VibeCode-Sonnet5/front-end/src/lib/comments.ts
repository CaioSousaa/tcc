import { api } from "./api";

export interface Comment {
  id: string;
  text: string;
  cardId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export async function fetchComments(
  boardId: string,
  cardId: string,
): Promise<Comment[]> {
  const { data } = await api.get<{ comments: Comment[] }>(
    `/boards/${boardId}/cards/${cardId}/comments`,
  );
  return data.comments;
}

export async function createComment(
  boardId: string,
  cardId: string,
  text: string,
): Promise<Comment> {
  const { data } = await api.post<{ comment: Comment }>(
    `/boards/${boardId}/cards/${cardId}/comments`,
    { text },
  );
  return data.comment;
}
