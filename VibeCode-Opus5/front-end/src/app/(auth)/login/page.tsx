"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandMark } from "@/components/BrandMark";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/errors";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await login({ email, password, rememberMe });
      router.replace("/quadros");
    } catch (error) {
      const parsed = parseApiError(error);
      setFieldErrors(parsed.fields);
      setFormError(parsed.message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <BrandMark />

      <h1 className="mt-12 text-[32px] font-bold tracking-tight">
        Entrar na sua conta
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        Acesse seus quadros com sessão persistente entre visitas.
      </p>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors["email"]}
          required
        />

        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors["password"]}
          required
        />

        <label className="flex items-center gap-2.5 text-[15px] text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--navy)]"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Manter-me conectado neste dispositivo
        </label>

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <SubmitButton isLoading={isSubmitting} loadingLabel="Entrando...">
          Entrar
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-[15px] text-muted">
        Não tem conta?{" "}
        <Link href="/criar-conta" className="font-semibold text-foreground">
          Criar conta
        </Link>
      </p>
    </>
  );
}
