import { api } from "./api";

export interface Comment {
  id: string;
  text: string;
  edited: boolean;
  cardId: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: string;
}

function commentsUrl(boardId: string, cardId: string): string {
  return `/boards/${boardId}/cards/${cardId}/comments`;
}

export async function listCommentsRequest(
  boardId: string,
  cardId: string
): Promise<Comment[]> {
  const response = await api.get<{ comments: Comment[] }>(commentsUrl(boardId, cardId));

  return response.data.comments;
}

export async function createCommentRequest(
  boardId: string,
  cardId: string,
  text: string
): Promise<Comment[]> {
  const response = await api.post<{ comments: Comment[] }>(commentsUrl(boardId, cardId), {
    text,
  });

  return response.data.comments;
}

export async function updateCommentRequest(
  boardId: string,
  cardId: string,
  commentId: string,
  text: string
): Promise<Comment[]> {
  const response = await api.put<{ comments: Comment[] }>(
    `${commentsUrl(boardId, cardId)}/${commentId}`,
    { text }
  );

  return response.data.comments;
}

export async function deleteCommentRequest(
  boardId: string,
  cardId: string,
  commentId: string
): Promise<Comment[]> {
  const response = await api.delete<{ comments: Comment[] }>(
    `${commentsUrl(boardId, cardId)}/${commentId}`
  );

  return response.data.comments;
}
