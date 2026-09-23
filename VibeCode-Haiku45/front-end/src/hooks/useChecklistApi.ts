import axios from "axios";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  cardId: string;
  createdAt: string;
  updatedAt: string;
}

export const useChecklistApi = () => {
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

  const getChecklistItems = async (cardId: string): Promise<ChecklistItem[]> => {
    const response = await apiClient.get(`/api/checklist/${cardId}`);
    return response.data;
  };

  const createChecklistItem = async (cardId: string, title: string): Promise<ChecklistItem> => {
    const response = await apiClient.post(`/api/checklist/${cardId}`, { title });
    return response.data;
  };

  const updateChecklistItem = async (itemId: string, data: { title?: string; completed?: boolean }): Promise<ChecklistItem> => {
    const response = await apiClient.patch(`/api/checklist/${itemId}`, data);
    return response.data;
  };

  const deleteChecklistItem = async (itemId: string): Promise<void> => {
    await apiClient.delete(`/api/checklist/${itemId}`);
  };

  return { getChecklistItems, createChecklistItem, updateChecklistItem, deleteChecklistItem };
};
