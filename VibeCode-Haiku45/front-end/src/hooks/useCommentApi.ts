import axios from "axios";

export interface Comment {
  id: string;
  content: string;
  cardId: string;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

export const useCommentApi = () => {
  const apiClient = axios.create({
    baseURL: "http://localhost:3333",
    withCredentials: true,
  });

  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const getComments = async (cardId: string): Promise<Comment[]> => {
    const response = await apiClient.get(`/api/comments/${cardId}`);
    return response.data;
  };

  const createComment = async (cardId: string, content: string): Promise<Comment> => {
    const response = await apiClient.post(`/api/comments/${cardId}`, { content });
    return response.data;
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    await apiClient.delete(`/api/comments/${commentId}`);
  };

  return { getComments, createComment, deleteComment };
};
