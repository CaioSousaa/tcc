"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { toApiError } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { COMMENT_BODY_MAX, validateCommentBody } from "@/schemas/comment";

type Props = {
  initialBody: string;
  onCancel: () => void;
  /** Resolves when handled; throws when the message belongs to the edit form (CE02). */
  onSave: (body: string) => Promise<void>;
};

/** Inline edit of the own comment: Salvar, Cancelar, Esc and Ctrl/Cmd+Enter (RF09 spec 2.5, F132). */
export function CommentEditForm({ initialBody, onCancel, onSave }: Props) {
  const fieldId = useId();
  const { submitting, run } = useSubmitLock();
  const [text, setText] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);

  function save() {
    void run(async () => {
      const result = validateCommentBody(text);
      if (!result.success) {
        setError(result.fields.body ?? null);
        return;
      }
      setError(null);
      try {
        await onSave(result.data.body);
      } catch (reason) {
        const apiError = toApiError(reason);
        setError(apiError.fields.body ?? apiError.message);
      }
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    save();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      // Cancels only the edit, never the card dialog (CA16).
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      save();
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="sr-only">
        Editar comentário
      </label>
      <textarea
        id={fieldId}
        autoFocus
        rows={3}
        maxLength={COMMENT_BODY_MAX * 4}
        value={text}
        readOnly={submitting}
        aria-invalid={error ? true : undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        className={`min-h-[84px] resize-y rounded-lg border bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
          error ? "border-danger" : "border-line"
        }`}
      />
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button type="submit" disabled={submitting} aria-busy={submitting} className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-80">
          {submitting ? "Salvando..." : "Salvar"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface">
          Cancelar
        </button>
      </div>
    </form>
  );
}
