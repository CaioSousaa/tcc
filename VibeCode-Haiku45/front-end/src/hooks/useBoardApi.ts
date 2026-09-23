import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";

export interface Board {
  id: string;
  title: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const useBoardApi = () => {
  const { user } = useAuth();

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

  const getBoards = async (): Promise<Board[]> => {
    const response = await apiClient.get("/api/boards");
    return response.data;
  };

  const getBoard = async (boardId: string): Promise<Board> => {
    const response = await apiClient.get(`/api/boards/${boardId}`);
    return response.data;
  };

  const createBoard = async (title: string, description?: string, color?: string): Promise<Board> => {
    const response = await apiClient.post("/api/boards", { title, description, color });
    return response.data;
  };

  const updateBoard = async (boardId: string, data: { title?: string; description?: string; color?: string }): Promise<Board> => {
    const response = await apiClient.patch(`/api/boards/${boardId}`, data);
    return response.data;
  };

  const deleteBoard = async (boardId: string): Promise<void> => {
    await apiClient.delete(`/api/boards/${boardId}`);
  };

  return { getBoards, getBoard, createBoard, updateBoard, deleteBoard };
};
