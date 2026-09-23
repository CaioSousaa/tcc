"use client";

import { useState } from "react";

interface SignupResponse {
  id: string;
  email: string;
}

export function useSignup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signup = async (email: string, password: string): Promise<SignupResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !password) {
        throw new Error("Preencha todos os campos");
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao cadastrar");
      }

      const data: SignupResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
}
