"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Board, updateBoard } from "@/lib/boards/api";
import { parseApiError } from "@/lib/auth/errors";
import { BOARD_COLOR_OPTIONS, getBoardColor, setBoardColor } from "@/lib/ui/board-colors";

export function EditBoardModal({
  board,
  onClose,
  onUpdated,
}: {
  board: Board;
  onClose: () => void;
  onUpdated: (board: Board) => void;
}) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? "");
  const [color, setColor] = useState(getBoardColor(board.id));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const updated = await updateBoard(board.id, { name, description });
      setBoardColor(board.id, color);
      onUpdated(updated);
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.fields) {
        setFieldErrors(apiError.fields);
      } else {
        setFormError(apiError.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Editar quadro" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome do quadro" error={fieldErrors.name}>
          <TextInput value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Field label="Descrição" error={fieldErrors.description}>
          <TextArea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Cor</span>
          <div className="flex gap-2">
            {BOARD_COLOR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Cor ${option}`}
                className={`h-7 w-7 rounded-full ring-offset-2 transition-shadow ${
                  color === option ? "ring-2 ring-brand" : ""
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar quadro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
