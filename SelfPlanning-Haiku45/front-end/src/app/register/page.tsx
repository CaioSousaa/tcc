"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push("/boards");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (senha !== confirmSenha) {
      setError("Senhas não conferem");
      return;
    }

    setLoading(true);

    try {
      await register(email, nome, senha);
      router.push("/boards");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao cadastrar";
      setError(errorMsg || "Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-blue-950 rounded-lg flex items-center justify-center text-white font-bold text-sm">K</div>
              <span className="font-semibold text-lg">Kanbo</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Criar conta</h1>
            <p className="text-gray-500">Leva menos de um minuto. Depois você já cria seu primeiro quadro.</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              placeholder="Seu Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              placeholder="Mínimo de 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Confirmar senha</label>
            <input
              type="password"
              placeholder="Repita a senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-950"
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
      </div>
      <div className="hidden lg:flex flex-1 bg-blue-950 text-white items-center p-16">
        <p className="text-2xl leading-relaxed max-w-md">
          Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no mesmo lugar.
        </p>
      </div>
    </div>
  );
}
