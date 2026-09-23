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

export default function CreateAccountPage() {
  const { signUp } = useAuth();
  const { isChecking } = useGuestOnly();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("As senhas não conferem");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({ name, email, password });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Não foi possível criar a conta. Tente novamente."));
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return null;
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-semibold text-foreground">
            Entrar
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <TextField
          label="Nome"
          autoComplete="name"
          placeholder="Caio Rocha"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a senha"
          minLength={8}
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          required
        />

        {error ? <FormMessage message={error} /> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
