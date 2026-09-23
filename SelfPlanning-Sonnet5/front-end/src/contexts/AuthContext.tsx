"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AxiosError } from "axios";
import { api } from "@/lib/api";
import {
  StoredUser,
  clearStoredSession,
  getStoredRefreshToken,
  getStoredUser,
  setStoredSession,
} from "@/lib/auth-storage";

interface AuthContextValue {
  user: StoredUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const refreshToken = getStoredRefreshToken();
      const cachedUser = getStoredUser();

      if (!refreshToken) {
        setLoading(false);
        return;
      }

      if (cachedUser) {
        setUser(cachedUser);
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data);
      } catch {
        clearStoredSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await api.post("/auth/login", { email, password, rememberMe });
      const { user: loggedUser, accessToken, refreshToken } = response.data;
      setStoredSession(accessToken, refreshToken, loggedUser);
      setUser(loggedUser);
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível entrar"));
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      await api.post("/auth/register", { name, email, password });
    } catch (error) {
      throw new Error(extractErrorMessage(error, "Não foi possível criar a conta"));
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } finally {
      clearStoredSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
