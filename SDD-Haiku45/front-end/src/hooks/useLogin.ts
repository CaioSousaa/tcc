"use client";

import { useState } from "react";
import { useAuth } from "./useAuth";

interface LoginResponse {
  id: string;
  email: string;
}

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();

  const login = async (email: string, password: string): Promise<LoginResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        throw new Error("Preencha todos os campos");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao fazer login");
      }

      const data: LoginResponse = await response.json();
      setUser(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}
