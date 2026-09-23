"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Board, createBoard } from "@/lib/boards/api";
import { createList } from "@/lib/lists/api";
import { parseApiError } from "@/lib/auth/errors";
import { BOARD_COLOR_OPTIONS, setBoardColor } from "@/lib/ui/board-colors";

const DEFAULT_LIST_NAMES = ["A fazer", "Em progresso", "Concluído"];

export function NewBoardModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (board: Board) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(BOARD_COLOR_OPTIONS[0]);
  const [withDefaultLists, setWithDefaultLists] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const board = await createBoard({ name });
      setBoardColor(board.id, color);
      if (withDefaultLists) {
        for (const listName of DEFAULT_LIST_NAMES) {
          await createList(board.id, { name: listName });
        }
      }
      onCreated(board);
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.fields) {
        setFieldErrors(apiError.fields);
      } else {
        setFormError(apiError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Novo quadro" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Nome do quadro" error={fieldErrors.name}>
          <TextInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Sprint 13"
            autoFocus
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

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={withDefaultLists}
            onChange={(event) => setWithDefaultLists(event.target.checked)}
            className="h-4 w-4 rounded border-border text-brand"
          />
          Criar com listas padrão (A fazer, Em progresso, Concluído)
        </label>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Criando..." : "Criar quadro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
