import { apiClient } from "@/lib/auth/api-client";

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
}

export interface Comment {
  id: string;
  text: string;
  cardId: string;
  author: CommentAuthor;
  createdAt: string;
}

function base(boardId: string, listId: string, cardId: string) {
  return `/boards/${boardId}/lists/${listId}/cards/${cardId}/comments`;
}

export async function listComments(
  boardId: string,
  listId: string,
  cardId: string,
): Promise<Comment[]> {
  const response = await apiClient.get<{ comments: Comment[] }>(base(boardId, listId, cardId));
  return response.data.comments;
}

export async function createComment(
  boardId: string,
  listId: string,
  cardId: string,
  text: string,
): Promise<Comment> {
  const response = await apiClient.post<Comment>(base(boardId, listId, cardId), { text });
  return response.data;
}
