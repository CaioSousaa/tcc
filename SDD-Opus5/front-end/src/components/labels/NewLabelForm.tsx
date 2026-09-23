"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { toApiError } from "@/lib/api";
import { DEFAULT_LABEL_COLOR, type LabelColor } from "@/lib/labelColors";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { FieldErrors } from "@/schemas/auth";
import { LABEL_NAME_MAX, validateLabelForm, type LabelFormField } from "@/schemas/label";
import { LabelColorPicker } from "./LabelColorPicker";

type Props = {
  /** Resolves when handled; throws when the message belongs to the form (A63, CE01). */
  onCreate: (name: string, color: LabelColor) => Promise<void>;
};

/** "Nova etiqueta": Nome, Criar and the palette with Vermelho pre-selected (RF08 spec 2.4). */
export function NewLabelForm({ onCreate }: Props) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { submitting, run } = useSubmitLock();
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>(DEFAULT_LABEL_COLOR);
  const [errors, setErrors] = useState<FieldErrors<LabelFormField>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void run(async () => {
      setFormError(null);
      const result = validateLabelForm({ name, color });
      if (!result.success) {
        setErrors(result.fields);
        inputRef.current?.focus();
        return;
      }
      setErrors({});
      try {
        await onCreate(result.data.name, result.data.color);
        // Created: field cleared with focus, color back to Vermelho (CA06).
        setName("");
        setColor(DEFAULT_LABEL_COLOR);
      } catch (reason) {
        const apiError = toApiError(reason);
        if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) setErrors(apiError.fields);
        else if (apiError.code === "LABEL_NAME_TAKEN" || apiError.code === "LABEL_LIMIT_REACHED") setErrors({ name: apiError.message });
        else setFormError(apiError.message);
      }
      inputRef.current?.focus();
    });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-surface/70 p-4">
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {MESSAGES.newLabel}
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={fieldId}
          autoComplete="off"
          placeholder={MESSAGES.labelName}
          maxLength={LABEL_NAME_MAX * 8}
          value={name}
          readOnly={submitting}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${fieldId}-error` : undefined}
          onChange={(event) => setName(event.target.value)}
          className={`h-11 min-w-0 flex-1 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 ${
            errors.name ? "border-danger" : "border-line"
          }`}
        />
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="h-11 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-80"
        >
          {submitting ? "Criando..." : "Criar"}
        </button>
      </div>
      {errors.name ? (
        <p id={`${fieldId}-error`} role="alert" className="text-sm text-danger">
          {errors.name}
        </p>
      ) : null}
      <LabelColorPicker value={color} onChange={setColor} disabled={submitting} error={errors.color} />
      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}
    </form>
  );
}
