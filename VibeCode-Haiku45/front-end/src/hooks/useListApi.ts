import axios from "axios";

export interface ListItem {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export const useListApi = () => {
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

  const getLists = async (boardId: string): Promise<ListItem[]> => {
    const response = await apiClient.get(`/api/lists/${boardId}`);
    return response.data;
  };

  const createList = async (boardId: string, title: string): Promise<ListItem> => {
    const response = await apiClient.post(`/api/lists/${boardId}`, { title });
    return response.data;
  };

  const updateList = async (listId: string, data: { title?: string; position?: number }): Promise<ListItem> => {
    const response = await apiClient.patch(`/api/lists/${listId}`, data);
    return response.data;
  };

  const deleteList = async (listId: string): Promise<void> => {
    await apiClient.delete(`/api/lists/${listId}`);
  };

  return { getLists, createList, updateList, deleteList };
};
