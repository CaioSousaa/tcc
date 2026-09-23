import axios from "axios";

export interface Card {
  id: string;
  title: string;
  description?: string;
  position: number;
  listId: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useCardApi = () => {
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

  const getCards = async (listId: string): Promise<Card[]> => {
    const response = await apiClient.get(`/api/cards/list/${listId}`);
    return response.data;
  };

  const createCard = async (listId: string, title: string, description?: string): Promise<Card> => {
    const response = await apiClient.post(`/api/cards/${listId}`, { title, description });
    return response.data;
  };

  const updateCard = async (cardId: string, data: { title?: string; description?: string; dueDate?: string | null }): Promise<Card> => {
    const response = await apiClient.patch(`/api/cards/${cardId}`, data);
    return response.data;
  };

  const moveCard = async (cardId: string, listId: string, position: number): Promise<Card> => {
    const response = await apiClient.patch(`/api/cards/${cardId}`, { listId, position });
    return response.data;
  };

  const deleteCard = async (cardId: string): Promise<void> => {
    await apiClient.delete(`/api/cards/${cardId}`);
  };

  return { getCards, createCard, updateCard, moveCard, deleteCard };
};
