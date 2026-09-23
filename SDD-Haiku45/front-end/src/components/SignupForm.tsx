"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignup } from "../hooks/useSignup";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatchError, setPasswordMismatchError] = useState("");
  const { signup, loading, error } = useSignup();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMismatchError("");

    if (password !== confirmPassword) {
      setPasswordMismatchError("Senhas não conferem");
      return;
    }

    try {
      await signup(email, password);
      router.push("/login");
    } catch (err) {
      // Erro já capturado em useSignup
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-950 rounded flex items-center justify-center text-white font-bold text-sm">K</div>
          <span className="font-semibold text-lg">Kanbo</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Criar conta</h1>
        <p className="text-gray-500">Leva menos de um minuto. Depois você já cria seu primeiro quadro.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      {passwordMismatchError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{passwordMismatchError}</div>
      )}

      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Nome</label>
        <input
          type="text"
          placeholder="Caio Rocha"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
          disabled={loading}
          required
        />
      </div>

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

      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">Senha</label>
        <input
          type="password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
          disabled={loading}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Confirmar senha</label>
        <input
          type="password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
          disabled={loading}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:bg-gray-400 transition"
      >
        {loading ? "Cadastrando..." : "Criar conta"}
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Já tem conta?{" "}
        <a href="/login" className="text-blue-950 font-medium hover:underline">
          Entrar
        </a>
      </p>
    </form>
  );
}
