import axios from "axios";

export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  role: "admin" | "editor" | "viewer";
  user: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export const useMemberApi = () => {
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

  const getMembers = async (boardId: string): Promise<BoardMember[]> => {
    const response = await apiClient.get(`/api/members/${boardId}`);
    return response.data;
  };

  const addMember = async (boardId: string, email: string, role: string): Promise<BoardMember> => {
    const response = await apiClient.post(`/api/members/${boardId}`, { email, role });
    return response.data;
  };

  const updateMemberRole = async (memberId: string, role: string): Promise<BoardMember> => {
    const response = await apiClient.patch(`/api/members/${memberId}`, { role });
    return response.data;
  };

  const removeMember = async (memberId: string): Promise<void> => {
    await apiClient.delete(`/api/members/${memberId}`);
  };

  return { getMembers, addMember, updateMemberRole, removeMember };
};
