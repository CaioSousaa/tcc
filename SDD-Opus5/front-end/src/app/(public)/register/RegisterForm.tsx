"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { toApiError } from "@/lib/api";
import { safeRedirect } from "@/lib/redirect";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { validateRegister, type FieldErrors, type RegisterForm as RegisterValues } from "@/schemas/auth";
import { authService } from "@/services/authService";

type Field = keyof RegisterValues;

export function RegisterForm({ redirect }: { redirect: string | undefined }) {
  const router = useRouter();
  const { submitting, run } = useSubmitLock();
  const [values, setValues] = useState<RegisterValues>({ name: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const loginHref = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";

  function update(field: Field) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  // Typed data stays, password fields are cleared after a failed attempt (spec 2.1).
  function clearPasswords() {
    setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void run(async () => {
      setFormError(null);

      const result = validateRegister(values);
      if (!result.success) {
        setFieldErrors(result.fields);
        clearPasswords();
        return;
      }
      setFieldErrors({});

      try {
        await authService.register(result.data);
        router.replace(safeRedirect(redirect));
      } catch (error) {
        const apiError = toApiError(error);
        clearPasswords();
        if (apiError.code === "EMAIL_ALREADY_EXISTS") {
          setFieldErrors({ email: apiError.message });
        } else if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) {
          setFieldErrors(apiError.fields);
        } else {
          setFormError(apiError.message);
        }
      }
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError ? <Alert>{formError}</Alert> : null}

      <TextField
        label="Nome"
        name="name"
        autoComplete="name"
        placeholder="Caio Rocha"
        value={values.name}
        onChange={update("name")}
        error={fieldErrors.name}
        disabled={submitting}
      />
      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="voce@empresa.com"
        value={values.email}
        onChange={update("email")}
        error={fieldErrors.email}
        disabled={submitting}
      />
      <TextField
        label="Senha"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres"
        value={values.password}
        onChange={update("password")}
        error={fieldErrors.password}
        disabled={submitting}
      />
      <TextField
        label="Confirmar senha"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repita a senha"
        value={values.confirmPassword}
        onChange={update("confirmPassword")}
        error={fieldErrors.confirmPassword}
        disabled={submitting}
      />

      <div className="mt-2">
        <SubmitButton loading={submitting} loadingLabel="Criando conta...">
          Criar conta
        </SubmitButton>
      </div>

      <p className="text-center text-[15px] text-muted">
        Já tem conta?{" "}
        <Link href={loginHref} className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
