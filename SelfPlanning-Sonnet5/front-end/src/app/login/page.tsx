"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password, rememberMe);
      router.push("/quadros");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Entrar na sua conta</h1>
      <p className="mb-6 text-sm text-slate-500">
        Acesse seus quadros com sessão persistente entre visitas.
      </p>

      <form onSubmit={handleSubmit}>
        <FormField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          id="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="mb-6 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1c3557] focus:ring-slate-500"
          />
          Manter-me conectado neste dispositivo
        </label>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#1c3557] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162a46] disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-slate-900">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}
