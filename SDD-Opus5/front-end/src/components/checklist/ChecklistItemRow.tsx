"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { PencilIcon, TrashIcon } from "@/components/boards/icons";
import { toApiError } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { CHECKLIST_ITEM_TEXT_MAX, validateChecklistText } from "@/schemas/checklist";
import type { ChecklistItem } from "@/services/checklistService";

type Props = {
  item: ChecklistItem;
  editing: boolean;
  /** Toggle or delete in progress: every control of the item is disabled (C135, CA21). */
  pending: boolean;
  onToggle: (item: ChecklistItem) => void;
  onRemove: (item: ChecklistItem) => void;
  onStartEdit: (item: ChecklistItem) => void;
  onCancelEdit: () => void;
  /** Resolves when handled; throws to show the error next to the edit field. */
  onSaveText: (item: ChecklistItem, text: string) => Promise<void>;
};

const iconButton =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface disabled:opacity-50";

/** One item: checkbox labelled by its text, edit and delete (spec 2.3–2.5, N126, N127). */
export function ChecklistItemRow({ item, editing, pending, onToggle, onRemove, onStartEdit, onCancelEdit, onSaveText }: Props) {
  const checkboxId = useId();
  const fieldId = useId();
  const { submitting, run } = useSubmitLock();
  const [draft, setDraft] = useState(item.text);
  const [error, setError] = useState<string | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void run(async () => {
      const result = validateChecklistText(draft);
      if (!result.success) {
        setError(result.fields.text ?? null);
        return;
      }
      setError(null);
      try {
        await onSaveText(item, result.data.text);
      } catch (reason) {
        setError(toApiError(reason).message);
      }
    });
  }

  // Esc cancels only the edit, not the card dialog (C136, CA25).
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onCancelEdit();
  }

  if (editing) {
    return (
      <li>
        <form noValidate onSubmit={save} className="flex flex-col gap-2">
          <label htmlFor={fieldId} className="sr-only">
            Texto do item
          </label>
          <input
            id={fieldId}
            autoFocus
            autoComplete="off"
            value={draft}
            maxLength={CHECKLIST_ITEM_TEXT_MAX * 8}
            readOnly={submitting}
            aria-invalid={error ? true : undefined}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className={`h-10 rounded-lg border bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              error ? "border-danger" : "border-line"
            }`}
          />
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" aria-busy={submitting} className="h-9 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
              {submitting ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" onClick={onCancelEdit} className="h-9 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-surface">
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-surface/70">
      <input
        id={checkboxId}
        type="checkbox"
        checked={item.done}
        disabled={pending}
        onChange={() => onToggle(item)}
        className="h-4 w-4 shrink-0 accent-brand"
      />
      <label
        htmlFor={checkboxId}
        className={`min-w-0 flex-1 cursor-pointer break-words text-[15px] [overflow-wrap:anywhere] ${
          item.done ? "text-muted line-through" : "text-ink"
        }`}
      >
        {item.text}
      </label>
      <button type="button" aria-label={`Editar item ${item.text}`} disabled={pending} onClick={() => onStartEdit(item)} className={iconButton}>
        <PencilIcon />
      </button>
      {/* Kept apart from the checkbox to avoid accidental deletions (plan section 8). */}
      <button type="button" aria-label={`Excluir item ${item.text}`} disabled={pending} onClick={() => onRemove(item)} className={`${iconButton} ml-1`}>
        <TrashIcon />
      </button>
    </li>
  );
}
