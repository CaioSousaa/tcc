"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandMark } from "@/components/BrandMark";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { useAuth } from "@/contexts/AuthContext";
import { parseApiError } from "@/lib/errors";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "As senhas não coincidem." });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register({ name, email, password, confirmPassword });
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

      <h1 className="mt-12 text-[32px] font-bold tracking-tight">Criar conta</h1>
      <p className="mt-2 text-[15px] text-muted">
        Leva menos de um minuto. Depois você já cria seu primeiro quadro.
      </p>

      <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          label="Nome"
          name="name"
          autoComplete="name"
          placeholder="Caio Rocha"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors["name"]}
          required
        />

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
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors["password"]}
          minLength={8}
          required
        />

        <TextField
          label="Confirmar senha"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={fieldErrors["confirmPassword"]}
          required
        />

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <SubmitButton isLoading={isSubmitting} loadingLabel="Criando conta...">
          Criar conta
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-[15px] text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-semibold text-foreground">
          Entrar
        </Link>
      </p>
    </>
  );
}
