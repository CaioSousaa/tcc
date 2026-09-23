"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { FormMessage } from "@/components/FormMessage";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestOnly } from "@/hooks/useGuestOnly";
import { getErrorMessage } from "@/lib/errors";

export default function LoginPage() {
  const { signIn } = useAuth();
  const { isChecking } = useGuestOnly();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepConnected, setKeepConnected] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signIn({ email, password, keepConnected });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Não foi possível entrar. Tente novamente."));
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return null;
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse seus quadros com sessão persistente entre visitas."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/criar-conta" className="font-semibold text-foreground">
            Criar conta
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={keepConnected}
            onChange={(event) => setKeepConnected(event.target.checked)}
          />
          Manter-me conectado neste dispositivo
        </label>

        {error ? <FormMessage message={error} /> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
