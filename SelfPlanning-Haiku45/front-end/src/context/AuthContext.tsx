"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, getMe, logout as apiLogout } from "@/lib/api";

interface User {
  id: string;
  email: string;
  nome: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  register: (email: string, nome: string, senha: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await getMe();
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(email: string, senha: string) {
    const { data } = await api.post("/auth/login", { email, senha });
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
    return data.user;
  }

  async function handleRegister(
    email: string,
    nome: string,
    senha: string
  ) {
    const { data } = await api.post("/auth/register", { email, nome, senha });
    localStorage.setItem("token", data.token);
    localStorage.setItem("refreshToken", data.refreshToken);
    setUser(data.user);
    return data.user;
  }

  async function handleLogout() {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
