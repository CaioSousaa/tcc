"use client";

import { useId, useRef } from "react";
import { DUE_DATE_MAX, DUE_DATE_MIN, localToday } from "@/lib/dueDate";
import { MESSAGES } from "@/lib/messages";
import { DueDateBadge } from "./DueDateBadge";

type Props = {
  /** "" or YYYY-MM-DD, as the native input reports it. */
  value: string;
  /** Receives the new value and whether the input holds an incomplete date (RF10 F149). */
  onChange: (value: string, badInput: boolean) => void;
  disabled?: boolean;
  error?: string | undefined;
};

/**
 * "Prazo" in the card dialog (RF10 spec 2.1). Part of the "Salvar card" form: changes
 * are only saved with the card (F148). The badge previews the date being edited (F150).
 */
export function DueDateField({ value, onChange, disabled = false, error }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const today = localToday(new Date());

  function remove() {
    if (inputRef.current) inputRef.current.value = "";
    onChange("", false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {MESSAGES.dueDateLabel}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="date"
        min={DUE_DATE_MIN}
        max={DUE_DATE_MAX}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(event) => onChange(event.target.value, event.target.validity.badInput)}
        // An incomplete date keeps the value "" and may not fire change: re-read validity on input and blur (F149).
        onInput={(event) => onChange(event.currentTarget.value, event.currentTarget.validity.badInput)}
        onBlur={(event) => onChange(event.currentTarget.value, event.currentTarget.validity.badInput)}
        className={`h-11 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${
          error ? "border-danger" : "border-line"
        }`}
      />
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {value !== "" && !error ? <DueDateBadge dueDate={value} today={today} size="md" /> : null}
      {value !== "" ? (
        <button
          type="button"
          onClick={remove}
          disabled={disabled}
          className="w-fit text-sm font-medium text-muted underline-offset-2 transition hover:text-ink hover:underline disabled:opacity-60"
        >
          {MESSAGES.removeDueDate}
        </button>
      ) : null}
    </div>
  );
}
