"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useAuth } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/auth/errors";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await login({ email, password });
      router.replace("/");
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.fields) {
        setFieldErrors(apiError.fields);
      } else {
        setFormError(apiError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Entrar na sua conta"
      subtitle="Acesse seus quadros com sessão persistente entre visitas."
      footer={
        <>
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="E-mail" error={fieldErrors.email}>
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Senha" error={fieldErrors.password}>
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            autoComplete="current-password"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(event) => setKeepSignedIn(event.target.checked)}
            className="h-4 w-4 rounded border-border accent-current text-brand"
          />
          Manter-me conectado neste dispositivo
        </label>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthShell>
  );
}
