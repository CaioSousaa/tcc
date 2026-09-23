"use client";

import { FormEvent, useState } from "react";
import { BOARD_COLOR_CLASSES, BOARD_COLOR_LABELS } from "@/lib/board-colors";
import { BOARD_COLORS, BoardColor } from "@/lib/boards";

interface BoardFormModalProps {
  title: string;
  submitLabel: string;
  initialTitle?: string;
  initialColor?: BoardColor;
  onClose: () => void;
  onSubmit: (values: { title: string; color: BoardColor }) => Promise<void>;
}

export function BoardFormModal({
  title,
  submitLabel,
  initialTitle = "",
  initialColor = "navy",
  onClose,
  onSubmit,
}: BoardFormModalProps) {
  const [boardTitle, setBoardTitle] = useState(initialTitle);
  const [color, setColor] = useState<BoardColor>(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!boardTitle.trim()) {
      setError("Nome do quadro é obrigatório.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ title: boardTitle.trim(), color });
    } catch {
      setError("Não foi possível salvar o quadro.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="board-title"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome do quadro
            </label>
            <input
              id="board-title"
              type="text"
              autoFocus
              required
              value={boardTitle}
              onChange={(event) => setBoardTitle(event.target.value)}
              placeholder="Ex.: Sprint 13"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Cor
            </span>
            <div className="flex gap-2">
              {BOARD_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={BOARD_COLOR_LABELS[option]}
                  onClick={() => setColor(option)}
                  className={`h-8 w-8 rounded-full ${BOARD_COLOR_CLASSES[option]} ${
                    color === option
                      ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Salvando..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
