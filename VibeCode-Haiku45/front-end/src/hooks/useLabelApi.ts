import axios from "axios";

export interface Label {
  id: string;
  name: string;
  color: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export const useLabelApi = () => {
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

  const getLabels = async (boardId: string): Promise<Label[]> => {
    const response = await apiClient.get(`/api/labels/${boardId}`);
    return response.data;
  };

  const createLabel = async (boardId: string, name: string, color?: string): Promise<Label> => {
    const response = await apiClient.post(`/api/labels/${boardId}`, { name, color });
    return response.data;
  };

  const updateLabel = async (labelId: string, data: { name?: string; color?: string }): Promise<Label> => {
    const response = await apiClient.patch(`/api/labels/${labelId}`, data);
    return response.data;
  };

  const deleteLabel = async (labelId: string): Promise<void> => {
    await apiClient.delete(`/api/labels/${labelId}`);
  };

  const addLabelToCard = async (cardId: string, labelId: string): Promise<void> => {
    await apiClient.post(`/api/labels/${cardId}/add/${labelId}`);
  };

  const removeLabelFromCard = async (cardId: string, labelId: string): Promise<void> => {
    await apiClient.post(`/api/labels/${cardId}/remove/${labelId}`);
  };

  return { getLabels, createLabel, updateLabel, deleteLabel, addLabelToCard, removeLabelFromCard };
};
