import { api } from "@/lib/api";

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export async function listComments(boardId: string): Promise<Comment[]> {
  const response = await api.get<{ comments: Comment[] }>(
    `/boards/${boardId}/comments`,
  );

  return response.data.comments;
}

export async function createComment(
  boardId: string,
  input: { cardId: string; body: string },
): Promise<Comment> {
  const response = await api.post<{ comment: Comment }>(
    `/boards/${boardId}/comments`,
    input,
  );

  return response.data.comment;
}

export async function deleteComment(
  boardId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`/boards/${boardId}/comments/${commentId}`);
}
