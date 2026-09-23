"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { extractErrorMessage, useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password, rememberMe);
      router.replace("/");
    } catch (err) {
      setError(extractErrorMessage(err, "Não foi possível entrar."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-8 py-16 dark:bg-black">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-white">
              K
            </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Kanbo
            </span>
          </div>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Entrar na sua conta
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Acesse seus quadros com sessão persistente entre visitas.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-slate-800 focus:ring-slate-500"
              />
              Manter-me conectado neste dispositivo
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Não tem conta?{" "}
            <Link
              href="/register"
              className="font-semibold text-slate-800 dark:text-zinc-50"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden flex-1 flex-col justify-center bg-slate-900 px-16 py-16 md:flex">
        <p className="max-w-md text-xl leading-8 text-zinc-100">
          Quadros, listas e cards em um fluxo só. Checklists, prazos,
          etiquetas e comentários no mesmo lugar.
        </p>
      </div>
    </div>
  );
}
