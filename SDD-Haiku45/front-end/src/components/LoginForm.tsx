"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../hooks/useLogin";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useLogin();
  const router = useRouter();
  const auth = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      // Erro já capturado em useLogin
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="font-semibold text-lg">Kanbo</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Entrar na sua conta</h1>
        <p className="text-gray-500">Acesse seus quadros com sessão persistente entre visitas.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">E-mail</label>
        <input
          type="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
          disabled={loading}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
          disabled={loading}
          required
        />
      </div>

      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="remember"
          className="w-4 h-4 accent-blue-950"
          defaultChecked
        />
        <label htmlFor="remember" className="ml-2 text-sm text-gray-700">Manter-me conectado neste dispositivo</label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:bg-gray-400 transition"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Não tem conta?{" "}
        <a href="/signup" className="text-blue-950 font-medium hover:underline">
          Criar conta
        </a>
      </p>
    </form>
  );
}
