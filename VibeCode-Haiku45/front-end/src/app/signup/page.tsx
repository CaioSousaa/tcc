"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signup() {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    router.push("/boards");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Senhas não correspondem");
      return;
    }

    if (password.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password, confirmPassword);
      router.push("/login");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Falha ao criar conta";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Form */}
      <div className="w-1/2 flex flex-col justify-center px-16 py-12 bg-white">
        <div className="max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">
              K
            </div>
            <span className="text-xl font-semibold text-gray-900">Kanbo</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar conta</h1>
          <p className="text-gray-600 mb-8">
            Leva menos de um minuto. Depois você já cria seu primeiro quadro.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Caio Rocha"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar conta"}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-gray-600">
            Já tem conta?{" "}
            <Link href="/login" className="text-blue-900 font-semibold hover:underline">
              Entrar
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center px-16 py-12">
        <div className="text-center max-w-md">
          <p className="text-white text-2xl font-light leading-relaxed">
            Quadros, listas e cards em um fluxo só. Checklists, prazos, etiquetas e comentários no mesmo lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
