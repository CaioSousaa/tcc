"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { PencilIcon, TrashIcon } from "@/components/boards/icons";
import { toApiError } from "@/lib/api";
import { isLabelColor, type LabelColor } from "@/lib/labelColors";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { FieldErrors } from "@/schemas/auth";
import { LABEL_NAME_MAX, validateLabelForm, type LabelFormField } from "@/schemas/label";
import type { LabelView } from "@/services/labelService";
import { LabelColorPicker } from "./LabelColorPicker";
import { LabelDot } from "./LabelChip";

type Props = {
  label: LabelView;
  editing: boolean;
  onStartEdit: (label: LabelView) => void;
  onCancelEdit: () => void;
  /** Resolves when handled; throws when the message belongs to the edit form. */
  onSave: (label: LabelView, name: string, color: LabelColor) => Promise<void>;
  onDelete: (label: LabelView) => void;
};

const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface";

/** Row of the management mode: color, name, usage, edit and delete; inline edit form (RF08 spec 2.5). */
export function LabelManageRow({ label, editing, onStartEdit, onCancelEdit, onSave, onDelete }: Props) {
  const fieldId = useId();
  const { submitting, run } = useSubmitLock();
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState<LabelColor>(isLabelColor(label.color) ? label.color : "gray");
  const [errors, setErrors] = useState<FieldErrors<LabelFormField>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void run(async () => {
      setFormError(null);
      const result = validateLabelForm({ name, color });
      if (!result.success) {
        setErrors(result.fields);
        return;
      }
      setErrors({});
      try {
        await onSave(label, result.data.name, result.data.color);
      } catch (reason) {
        const apiError = toApiError(reason);
        if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) setErrors(apiError.fields);
        else if (apiError.code === "LABEL_NAME_TAKEN") setErrors({ name: apiError.message });
        else setFormError(apiError.message);
      }
    });
  }

  // Esc cancels only the edit, not the window (N180, CA16).
  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onCancelEdit();
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-brand/40 bg-white p-3">
        <form noValidate onSubmit={save} onKeyDown={handleKeyDown} className="flex flex-col gap-3">
          <label htmlFor={fieldId} className="sr-only">
            Nome da etiqueta
          </label>
          <input
            id={fieldId}
            autoFocus
            autoComplete="off"
            maxLength={LABEL_NAME_MAX * 8}
            value={name}
            readOnly={submitting}
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => setName(event.target.value)}
            className={`h-10 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              errors.name ? "border-danger" : "border-line"
            }`}
          />
          {errors.name ? (
            <p role="alert" className="text-sm text-danger">
              {errors.name}
            </p>
          ) : null}
          <LabelColorPicker value={color} onChange={setColor} disabled={submitting} error={errors.color} />
          {formError ? (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" aria-busy={submitting} disabled={submitting} className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-80">
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onCancelEdit} disabled={submitting} className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface">
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <LabelDot color={label.color} />
      <span className="min-w-0 flex-1 break-words text-[15px] text-ink [overflow-wrap:anywhere]">{label.name}</span>
      <span className="font-mono text-xs text-muted" aria-label={`${label.usage} cards`}>
        {label.usage}
      </span>
      <button type="button" aria-label={`Editar etiqueta ${label.name}`} onClick={() => onStartEdit(label)} className={iconButton}>
        <PencilIcon />
      </button>
      <button type="button" aria-label={`Excluir etiqueta ${label.name}`} onClick={() => onDelete(label)} className={`${iconButton} text-danger`}>
        <TrashIcon />
      </button>
    </li>
  );
}
