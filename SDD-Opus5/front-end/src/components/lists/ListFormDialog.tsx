"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { toApiError } from "@/lib/api";
import { positionOptions, previewOrder, type ListDraft } from "@/lib/listOrder";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { FieldErrors } from "@/schemas/auth";
import { LIST_NAME_MAX, validateListForm, type ListFormField, type ListFormValues } from "@/schemas/list";
import type { BoardListItem } from "@/services/boardService";
import { ListOrderPreview } from "./ListOrderPreview";
import { PositionSelect } from "./PositionSelect";

export type ListFormMode = { type: "create" } | { type: "edit"; list: BoardListItem };

type Props = {
  mode: ListFormMode;
  /** Lists of the board when the dialog opened; the preview works on a copy (C60). */
  lists: readonly BoardListItem[];
  onClose: () => void;
  /** Throws on failure; the dialog shows the error and stays open (CE01). */
  onSubmit: (values: ListFormValues) => Promise<void>;
};

/** One dialog "Lista" for adding and editing (C61). Mounted on open, so it always starts fresh (CA15). */
export function ListFormDialog({ mode, lists, onClose, onSubmit }: Props) {
  const snapshot = useMemo(() => lists.map((list) => ({ ...list })), [lists]);
  const { submitting, run } = useSubmitLock();
  const [name, setName] = useState(mode.type === "edit" ? mode.list.name : "");
  const [position, setPosition] = useState(mode.type === "edit" ? mode.list.position : snapshot.length + 1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ListFormField>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const draft: ListDraft =
    mode.type === "create"
      ? { mode: "create", name, position }
      : { mode: "edit", listId: mode.list.id, name, position };

  const options = positionOptions(snapshot.length, draft.mode);
  const preview = previewOrder(snapshot, draft);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void run(async () => {
      setFormError(null);
      const result = validateListForm({ name, position });
      if (!result.success) {
        // Nothing is sent: neither name nor position change (CA25).
        setFieldErrors(result.fields);
        return;
      }
      setFieldErrors({});

      try {
        await onSubmit(result.data);
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) {
          setFieldErrors(apiError.fields);
        } else {
          setFormError(apiError.message);
        }
      }
    });
  }

  return (
    <Modal open title="Lista" onClose={onClose} busy={submitting}>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {formError ? <Alert>{formError}</Alert> : null}

        <TextField
          label="Nome da lista"
          name="name"
          autoComplete="off"
          data-autofocus
          // Long pasted text is kept so the limit message can be shown (CB11).
          maxLength={LIST_NAME_MAX * 8}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
          disabled={submitting}
        />

        <PositionSelect
          options={options}
          value={position}
          onChange={setPosition}
          disabled={submitting}
          error={fieldErrors.position}
        />

        <ListOrderPreview items={preview} />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 rounded-lg border border-line bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-surface disabled:opacity-60"
          >
            Cancelar
          </button>
          <div className="min-w-[140px]">
            <SubmitButton loading={submitting} loadingLabel="Salvando...">
              Salvar lista
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
