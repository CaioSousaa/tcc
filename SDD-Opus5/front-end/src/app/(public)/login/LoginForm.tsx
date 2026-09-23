"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { toApiError } from "@/lib/api";
import { MESSAGES } from "@/lib/messages";
import { safeRedirect } from "@/lib/redirect";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { validateLogin, type FieldErrors, type LoginForm as LoginValues } from "@/schemas/auth";
import { authService } from "@/services/authService";

type Props = { redirect: string | undefined; expired: boolean };

export function LoginForm({ redirect, expired }: Props) {
  const router = useRouter();
  const { submitting, run } = useSubmitLock();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<keyof LoginValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(expired);

  const registerHref = redirect ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void run(async () => {
      setFormError(null);
      setShowExpired(false);

      const result = validateLogin({ email, password, rememberMe });
      if (!result.success) {
        setFieldErrors(result.fields);
        setPassword("");
        return; // CA14: no authentication attempt
      }
      setFieldErrors({});

      try {
        await authService.login(result.data);
        router.replace(safeRedirect(redirect));
      } catch (error) {
        const apiError = toApiError(error);
        // E-mail stays, password is cleared (spec 2.2).
        setPassword("");
        if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) {
          setFieldErrors(apiError.fields);
        } else {
          setFormError(apiError.message);
        }
      }
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {showExpired ? <Alert tone="info">{MESSAGES.sessionExpired}</Alert> : null}
      {formError ? <Alert>{formError}</Alert> : null}

      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="voce@empresa.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        disabled={submitting}
      />
      <TextField
        label="Senha"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        disabled={submitting}
      />

      <label className="flex cursor-pointer items-center gap-3 text-[15px] text-ink">
        <input
          type="checkbox"
          name="rememberMe"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={submitting}
          className="h-5 w-5 accent-brand"
        />
        Manter-me conectado neste dispositivo
      </label>

      <div className="mt-2">
        <SubmitButton loading={submitting} loadingLabel="Entrando...">
          Entrar
        </SubmitButton>
      </div>

      <p className="text-center text-[15px] text-muted">
        Não tem conta?{" "}
        <Link href={registerHref} className="font-semibold text-brand hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
