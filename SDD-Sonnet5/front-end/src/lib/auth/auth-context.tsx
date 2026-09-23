"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient, setAccessToken, setUnauthenticatedHandler } from "./api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface SessionResponse {
  user: AuthUser;
  accessToken: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(clearSession);
    return () => setUnauthenticatedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapSession() {
      try {
        const refreshResponse = await apiClient.post<{ accessToken: string }>("/auth/refresh");
        setAccessToken(refreshResponse.data.accessToken);
        const meResponse = await apiClient.get<AuthUser>("/auth/me");
        if (!cancelled) {
          setUser(meResponse.data);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      }
    }

    bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await apiClient.post<SessionResponse>("/auth/register", input);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    setStatus("authenticated");
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await apiClient.post<SessionResponse>("/auth/login", input);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, register, login, logout }),
    [user, status, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
