"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    router.push("/boards");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }
      router.push("/boards");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Falha ao fazer login";
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Entrar na sua conta</h1>
          <p className="text-gray-600 mb-8">
            Acesse seus quadros com sessão persistente entre visitas.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

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
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 text-blue-900 rounded focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                Manter-me conectado neste dispositivo
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-900 text-white font-semibold py-3 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-6 text-center text-gray-600">
            Não tem conta?{" "}
            <Link href="/signup" className="text-blue-900 font-semibold hover:underline">
              Criar conta
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
