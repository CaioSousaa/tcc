"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AxiosError } from "axios";
import { api } from "@/lib/api";
import { setAccessToken } from "@/lib/auth-token";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { error?: string } | undefined)
      ?.error;
    if (message) return message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .post<AuthResponse>("/auth/refresh")
      .then(({ data }) => {
        if (!active) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
        rememberMe,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name,
        email,
        password,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
