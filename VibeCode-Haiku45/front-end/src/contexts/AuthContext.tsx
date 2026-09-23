"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const checkAuth = async () => {
    try {
      const response = await apiClient.get("/api/auth/verify");
      setUser(response.data.user);
      setIsAuthenticated(response.data.isAuthenticated);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.post("/api/auth/login", { email, password });
    setUser(response.data.user);
    setIsAuthenticated(true);
    localStorage.setItem("auth_token", response.data.token);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    await apiClient.post("/api/auth/register", { name, email, password, confirmPassword });
  };

  const logout = async () => {
    await apiClient.post("/api/auth/logout");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("auth_token");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token && !isAuthenticated) {
      checkAuth();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
