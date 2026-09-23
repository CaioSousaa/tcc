"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { toApiError } from "@/lib/api";
import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { EMAIL_MAX } from "@/schemas/auth";
import { validateInviteEmail } from "@/schemas/member";
import { RoleSelect } from "./RoleSelect";

type Props = {
  /** Resolves when handled; throws when the message belongs next to the e-mail field (A58). */
  onInvite: (email: string, role: BoardRole) => Promise<void>;
};

/** E-mail, role and "Convidar" in one line (RF07 spec 2.4, N155). */
export function InviteForm({ onInvite }: Props) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { submitting, run } = useSubmitLock();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardRole>("member");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const result = validateInviteEmail(email);
      if (!result.success) {
        setError(result.fields.email ?? null);
        inputRef.current?.focus();
        return;
      }
      setError(null);
      try {
        await onInvite(result.data.email, role);
        // Valid invitation: field cleared, "Membro" again, focus kept (CA05).
        setEmail("");
        setRole("member");
      } catch (reason) {
        // E-mail and role stay as typed (CE01).
        const apiError = toApiError(reason);
        setError(apiError.fields.email ?? apiError.fields.role ?? apiError.message);
      }
      inputRef.current?.focus();
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={fieldId} className="sr-only">
          {MESSAGES.inviteEmailLabel}
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          type="email"
          data-autofocus
          autoComplete="off"
          placeholder={MESSAGES.inviteEmailLabel}
          maxLength={EMAIL_MAX * 2}
          value={email}
          readOnly={submitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          onChange={(event) => setEmail(event.target.value)}
          className={`h-11 min-w-0 flex-1 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            error ? "border-danger" : "border-line"
          }`}
        />
        <RoleSelect value={role} label="Papel do convidado" onChange={setRole} disabled={submitting} className="h-11 sm:w-40" />
        <button
          type="submit"
          aria-busy={submitting}
          disabled={submitting}
          className="h-11 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-80"
        >
          {submitting ? "Convidando..." : "Convidar"}
        </button>
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
