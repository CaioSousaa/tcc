"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toApiError } from "@/lib/api";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { CHECKLIST_ITEM_TEXT_MAX, validateChecklistText } from "@/schemas/checklist";

type Props = {
  /** Resolves when handled (added or taken over by the section); throws to show the error in the field. */
  onSubmit: (text: string) => Promise<void>;
  onCancel: () => void;
};

/** "Texto do item" field (spec 2.2). Stays open, empty and focused after each item (CA08, N130). */
export function AddChecklistItemForm({ onSubmit, onCancel }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { submitting, run } = useSubmitLock();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void run(async () => {
      const result = validateChecklistText(text);
      if (!result.success) {
        setError(result.fields.text ?? null);
        return;
      }
      setError(null);
      try {
        await onSubmit(result.data.text);
        setText("");
      } catch (reason) {
        setError(toApiError(reason).message);
      } finally {
        inputRef.current?.focus();
      }
    });
  }

  // Esc closes only this field, never the card dialog (C136).
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onCancel();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {MESSAGES.checklistFieldLabel}
      </label>
      <input
        id={id}
        ref={inputRef}
        autoFocus
        autoComplete="off"
        placeholder={MESSAGES.checklistFieldLabel}
        value={text}
        maxLength={CHECKLIST_ITEM_TEXT_MAX * 8}
        readOnly={submitting}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        className={`h-10 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? "border-danger" : "border-line"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" aria-busy={submitting} className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          {submitting ? "Adicionando..." : "Adicionar"}
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface">
          Cancelar
        </button>
      </div>
    </form>
  );
}
