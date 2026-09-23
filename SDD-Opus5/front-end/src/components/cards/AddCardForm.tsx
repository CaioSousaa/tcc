"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toApiError } from "@/lib/api";
import { CARD_TITLE_MAX } from "@/lib/cardText";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { validateNewCard } from "@/schemas/card";

type Props = {
  listName: string;
  /** Resolves when the card was created; throws when the form must show the error (CE01). */
  onSubmit: (title: string) => Promise<void>;
  onCancel: () => void;
};

/**
 * Inline "Título do card" field (spec 2.2). Enter submits through the native form,
 * Esc cancels, and the field stays open, empty and focused after each card (CA07, F43).
 */
export function AddCardForm({ listName, onSubmit, onCancel }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { submitting, run } = useSubmitLock();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const result = validateNewCard({ title });
      if (!result.success) {
        setError(result.fields.title ?? null);
        return;
      }
      setError(null);
      try {
        await onSubmit(result.data.title);
        setTitle("");
      } catch (reason) {
        setError(toApiError(reason).message);
      } finally {
        inputRef.current?.focus();
      }
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2" aria-label={`Adicionar card em ${listName}`}>
      <label htmlFor={id} className="sr-only">
        Título do card
      </label>
      <input
        id={id}
        ref={inputRef}
        autoFocus
        autoComplete="off"
        placeholder="Título do card"
        value={title}
        // Pasted long text is kept so the limit message can be shown (CB03).
        maxLength={CARD_TITLE_MAX * 8}
        // readOnly instead of disabled keeps the focus in the field while sending.
        readOnly={submitting}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        className={`h-11 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? "border-danger" : "border-line"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          aria-busy={submitting}
          className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark aria-busy:opacity-80"
        >
          {submitting ? "Adicionando..." : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
