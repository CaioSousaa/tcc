"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { useAuth } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/auth/errors";

export default function CadastroPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "As senhas não coincidem" });
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password });
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
      title="Criar conta"
      subtitle="Leva menos de um minuto. Depois você já cria seu primeiro quadro."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome" error={fieldErrors.name}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Caio Rocha"
            autoComplete="name"
          />
        </Field>
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
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirmar senha" error={fieldErrors.confirmPassword}>
          <TextInput
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
        </Field>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthShell>
  );
}
