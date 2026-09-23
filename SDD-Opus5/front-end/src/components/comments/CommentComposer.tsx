"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Avatar } from "@/components/members/Avatar";
import { toApiError } from "@/lib/api";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { COMMENT_BODY_MAX, validateCommentBody } from "@/schemas/comment";

type Props = {
  currentUser: { id: string; name: string } | null;
  /** Resolves when published or handled; throws when the message belongs next to the field (F133). */
  onPublish: (body: string) => Promise<boolean>;
};

/** Avatar, text area and "Comentar" (RF09 spec 2.3, plan F131). */
export function CommentComposer({ currentUser, onPublish }: Props) {
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitting, run } = useSubmitLock();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function publish() {
    void run(async () => {
      const result = validateCommentBody(text);
      if (!result.success) {
        setError(result.fields.body ?? null);
        textareaRef.current?.focus();
        return;
      }
      setError(null);
      try {
        // The text is cleared only after success (CE01).
        if (await onPublish(result.data.body)) setText("");
      } catch (reason) {
        const apiError = toApiError(reason);
        setError(apiError.fields.body ?? apiError.message);
      }
      textareaRef.current?.focus();
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    publish();
  }

  // Enter adds a line break; Ctrl+Enter or Cmd+Enter publishes (CA07).
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      publish();
    }
  }

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="flex gap-3">
      {currentUser ? <Avatar name={currentUser.name} colorKey={currentUser.id} size="md" decorative /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor={fieldId} className="sr-only">
          {MESSAGES.commentPlaceholder}
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          rows={3}
          placeholder={MESSAGES.commentPlaceholder}
          // Long pasted text is kept so the limit message can be shown.
          maxLength={COMMENT_BODY_MAX * 4}
          value={text}
          readOnly={submitting}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          className={`min-h-[84px] resize-y rounded-lg border bg-white px-3 py-2 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            error ? "border-danger" : "border-line"
          }`}
        />
        {error ? (
          <p id={`${fieldId}-error`} role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="h-10 w-fit rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-80"
        >
          {submitting ? "Comentando..." : "Comentar"}
        </button>
      </div>
    </form>
  );
}
