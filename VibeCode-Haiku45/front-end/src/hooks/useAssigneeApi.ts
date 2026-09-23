import axios from "axios";

export interface CardAssignee {
  id: string;
  cardId: string;
  userId: string;
  user: { id: string; name: string; email: string };
  createdAt: string;
}

export const useAssigneeApi = () => {
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

  const getAssignees = async (cardId: string): Promise<CardAssignee[]> => {
    const response = await apiClient.get(`/api/assignees/${cardId}`);
    return response.data;
  };

  const assignUser = async (cardId: string, userId: string): Promise<CardAssignee> => {
    const response = await apiClient.post(`/api/assignees/${cardId}`, { userId });
    return response.data;
  };

  const removeAssignee = async (assigneeId: string): Promise<void> => {
    await apiClient.delete(`/api/assignees/${assigneeId}`);
  };

  return { getAssignees, assignUser, removeAssignee };
};
