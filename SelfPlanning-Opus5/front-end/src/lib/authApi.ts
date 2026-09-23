import { API_URL, api } from "./api";
import axios from "axios";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SessionResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthenticatedUser> {
  const response = await axios.post<{ user: AuthenticatedUser }>(
    `${API_URL}/auth/register`,
    payload
  );

  return response.data.user;
}

export async function loginRequest(payload: LoginPayload): Promise<SessionResponse> {
  const response = await axios.post<SessionResponse>(`${API_URL}/auth/login`, payload);

  return response.data;
}

export async function meRequest(): Promise<AuthenticatedUser> {
  const response = await api.get<{ user: AuthenticatedUser }>("/auth/me");

  return response.data.user;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await axios.post(`${API_URL}/auth/logout`, { refreshToken });
}
