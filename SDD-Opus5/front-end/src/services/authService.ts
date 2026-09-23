import { api } from "@/lib/api";
import type { LoginForm, RegisterForm } from "@/schemas/auth";

export type User = { id: string; name: string; email: string };

type UserResponse = { user: User };

// Every call handles its own 401: these endpoints define the session, they don't consume it.
export const authService = {
  async register(payload: RegisterForm): Promise<User> {
    const { data } = await api.post<UserResponse>("/auth/register", payload, { skipSessionHandler: true });
    return data.user;
  },

  async login(payload: LoginForm): Promise<User> {
    const { data } = await api.post<UserResponse>("/auth/login", payload, { skipSessionHandler: true });
    return data.user;
  },

  async me(): Promise<User> {
    const { data } = await api.get<UserResponse>("/auth/me", { skipSessionHandler: true });
    return data.user;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout", undefined, { skipSessionHandler: true });
  },
};
