"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { SubmitButton } from "@/components/SubmitButton";
import { TextField } from "@/components/TextField";
import { toApiError } from "@/lib/api";
import { DEFAULT_BOARD_COLOR, type BoardColor } from "@/lib/boardColors";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import { BOARD_NAME_MAX, validateBoardForm, type BoardFormField, type BoardFormValues } from "@/schemas/board";
import type { FieldErrors } from "@/schemas/auth";
import { ColorPicker } from "./ColorPicker";

export type BoardFormMode =
  | { type: "create" }
  | { type: "edit"; name: string; color: BoardColor; lockListDeletion: boolean };

type Props = {
  mode: BoardFormMode;
  onClose: () => void;
  /** Throws on failure; the dialog shows the error and stays open (CE02). */
  onSubmit: (values: BoardFormValues) => Promise<void>;
};

function initialValues(mode: BoardFormMode): BoardFormValues {
  return mode.type === "create"
    ? { name: "", color: DEFAULT_BOARD_COLOR, withDefaultLists: true, lockListDeletion: false }
    : { name: mode.name, color: mode.color, withDefaultLists: false, lockListDeletion: mode.lockListDeletion };
}

/**
 * One form for creating and editing (F16, C39). The parent mounts it when
 * opening, so each opening starts from the defaults or current values (F18).
 */
export function BoardFormDialog({ mode, onClose, onSubmit }: Props) {
  const isCreate = mode.type === "create";
  const { submitting, run } = useSubmitLock();
  const [values, setValues] = useState<BoardFormValues>(() => initialValues(mode));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<BoardFormField>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void run(async () => {
      setFormError(null);
      const result = validateBoardForm(values);
      if (!result.success) {
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
    <Modal open title={isCreate ? "Novo quadro" : "Editar quadro"} onClose={onClose} busy={submitting}>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
        {formError ? <Alert>{formError}</Alert> : null}

        <TextField
          label="Nome do quadro"
          name="name"
          placeholder="Ex.: Sprint 13"
          data-autofocus
          autoComplete="off"
          maxLength={BOARD_NAME_MAX * 4}
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          error={fieldErrors.name}
          disabled={submitting}
        />

        <ColorPicker
          value={values.color}
          onChange={(color) => setValues((current) => ({ ...current, color }))}
          disabled={submitting}
          error={fieldErrors.color}
        />

        {isCreate ? (
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              name="withDefaultLists"
              checked={values.withDefaultLists}
              onChange={(event) => setValues((current) => ({ ...current, withDefaultLists: event.target.checked }))}
              disabled={submitting}
              className="mt-1 h-5 w-5 accent-brand"
            />
            Criar com listas padrão (A fazer, Em progresso, Concluído)
          </label>
        ) : (
          // Board setting of RF05, only when editing (F62, CA01, CA02).
          <label className="flex cursor-pointer items-start gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              name="lockListDeletion"
              checked={values.lockListDeletion}
              onChange={(event) => setValues((current) => ({ ...current, lockListDeletion: event.target.checked }))}
              disabled={submitting}
              className="mt-1 h-5 w-5 accent-brand"
            />
            {MESSAGES.lockListDeletionOption}
          </label>
        )}

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
            <SubmitButton loading={submitting} loadingLabel={isCreate ? "Criando..." : "Salvando..."}>
              {isCreate ? "Criar quadro" : "Salvar"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}
