"use client";

import { FormEvent, useState } from "react";
import { Modal } from "./Modal";
import { FormMessage } from "./FormMessage";
import { TextField } from "./TextField";
import {
  BOARD_COLORS,
  BOARD_COLOR_HEX,
  BOARD_COLOR_LABEL,
  BoardColor,
  DEFAULT_BOARD_COLOR,
} from "@/lib/boardColors";
import { Board, BoardPayload } from "@/lib/boardsApi";
import { getErrorMessage } from "@/lib/errors";

interface BoardFormModalProps {
  board?: Board;
  onClose: () => void;
  onSubmit: (payload: BoardPayload) => Promise<void>;
}

/** Mesmo formulário atende a criação e a edição de um quadro. */
export function BoardFormModal({ board, onClose, onSubmit }: BoardFormModalProps) {
  const isEditing = board !== undefined;

  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState<BoardColor>(board?.color ?? DEFAULT_BOARD_COLOR);
  const [blockListDeletion, setBlockListDeletion] = useState(
    board?.blockListDeletionWithCards ?? false
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: name.trim(),
        color,
        blockListDeletionWithCards: blockListDeletion,
      });
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          isEditing ? "Não foi possível salvar o quadro." : "Não foi possível criar o quadro."
        )
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Editar quadro" : "Novo quadro"} onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Nome do quadro"
          placeholder="Ex.: Sprint 13"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
          required
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm text-foreground">Cor</span>
          <div className="flex gap-3">
            {BOARD_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={BOARD_COLOR_LABEL[option]}
                aria-pressed={color === option}
                onClick={() => setColor(option)}
                style={{ backgroundColor: BOARD_COLOR_HEX[option] }}
                className={`h-9 w-9 rounded-lg transition-transform ${
                  color === option
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface"
                    : "hover:scale-105"
                }`}
              />
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand"
            checked={blockListDeletion}
            onChange={(event) => setBlockListDeletion(event.target.checked)}
          />
          <span>
            Bloquear exclusão de listas enquanto houver cards
            <span className="block text-xs text-muted">
              Regra do quadro: listas com cards só podem ser excluídas depois de esvaziadas.
            </span>
          </span>
        </label>

        {error ? <FormMessage message={error} /> : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || name.trim().length === 0}
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isEditing ? "Salvar alterações" : "Criar quadro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
