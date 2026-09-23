"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { FormField } from "@/components/FormField";
import { useAuth } from "@/contexts/AuthContext";

export default function CadastroPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Senha deve ter no mínimo 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Criar conta</h1>
      <p className="mb-6 text-sm text-slate-500">
        Leva menos de um minuto. Depois você já cria seu primeiro quadro.
      </p>

      <form onSubmit={handleSubmit}>
        <FormField
          id="name"
          label="Nome"
          type="text"
          autoComplete="name"
          placeholder="Caio Rocha"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          id="confirmPassword"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-[#1c3557] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#162a46] disabled:opacity-60"
        >
          {submitting ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-slate-900">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
