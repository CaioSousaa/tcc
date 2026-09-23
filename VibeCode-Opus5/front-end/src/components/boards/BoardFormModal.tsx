"use client";

import { useState, type FormEvent } from "react";
import { CloseIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import {
  BOARD_COLORS,
  BOARD_COLOR_HEX,
  type Board,
  type BoardColor,
  type BoardInput,
} from "@/lib/boards";
import { parseApiError } from "@/lib/errors";

interface BoardFormModalProps {
  board?: Board | undefined;
  onClose: () => void;
  onSubmit: (input: BoardInput) => Promise<void>;
}

export function BoardFormModal({
  board,
  onClose,
  onSubmit,
}: BoardFormModalProps) {
  const isEditing = Boolean(board);

  const [title, setTitle] = useState(board?.title ?? "");
  const [color, setColor] = useState<BoardColor>(board?.color ?? "navy");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await onSubmit({ title, color });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      setFieldErrors(parsed.fields);
      setFormError(parsed.message);
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {isEditing ? "Editar quadro" : "Novo quadro"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Nome do quadro"
          name="title"
          placeholder="Ex.: Sprint 13"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors["title"]}
          autoFocus
          required
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm text-foreground">Cor</legend>
          <div className="flex gap-3">
            {BOARD_COLORS.map((boardColor) => (
              <button
                key={boardColor}
                type="button"
                aria-label={`Cor ${boardColor}`}
                aria-pressed={color === boardColor}
                onClick={() => setColor(boardColor)}
                style={{ backgroundColor: BOARD_COLOR_HEX[boardColor] }}
                className={`h-9 w-9 rounded-md transition ${
                  color === boardColor
                    ? "ring-2 ring-foreground/70 ring-offset-2"
                    : ""
                }`}
              />
            ))}
          </div>
          {fieldErrors["color"] ? (
            <p className="text-xs text-danger">{fieldErrors["color"]}</p>
          ) : null}
        </fieldset>

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditing ? "Salvar" : "Criar quadro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
