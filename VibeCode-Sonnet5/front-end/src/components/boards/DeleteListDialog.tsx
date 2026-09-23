"use client";

import { useState } from "react";
import { BoardList } from "@/lib/lists";

interface DeleteListDialogProps {
  list: BoardList;
  cardCount: number;
  otherLists: BoardList[];
  onClose: () => void;
  onConfirm: (strategy: "move" | "delete", targetListId?: string) => Promise<void>;
}

export function DeleteListDialog({
  list,
  cardCount,
  otherLists,
  onClose,
  onConfirm,
}: DeleteListDialogProps) {
  const canMove = otherLists.length > 0;
  const [strategy, setStrategy] = useState<"move" | "delete">(
    canMove ? "move" : "delete",
  );
  const [targetListId, setTargetListId] = useState(otherLists[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (cardCount === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <span className="text-xl text-red-600">⚠</span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Excluir a lista &ldquo;{list.title}&rdquo;?
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Esta ação é irreversível.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await onConfirm("delete");
                } catch {
                  setError("Não foi possível excluir a lista.");
                  setSubmitting(false);
                }
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Excluindo..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    if (strategy === "move" && !targetListId) {
      setError("Selecione a lista de destino.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onConfirm(strategy, strategy === "move" ? targetListId : undefined);
    } catch {
      setError("Não foi possível excluir a lista.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="text-xl text-red-600">⚠</span>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Excluir a lista &ldquo;{list.title}&rdquo;?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ela contém {cardCount} {cardCount === 1 ? "card" : "cards"}.
              Escolha o que deve acontecer com eles.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {canMove && (
            <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                <input
                  type="radio"
                  name="delete-strategy"
                  checked={strategy === "move"}
                  onChange={() => setStrategy("move")}
                />
                Mover os cards para outra lista
              </span>
              <span className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
                Recomendado. Nenhum card é perdido.
              </span>
              {strategy === "move" && (
                <select
                  value={targetListId}
                  onChange={(event) => setTargetListId(event.target.value)}
                  className="ml-6 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                >
                  {otherLists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              )}
            </label>
          )}

          <label className="flex cursor-pointer flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              <input
                type="radio"
                name="delete-strategy"
                checked={strategy === "delete"}
                onChange={() => setStrategy("delete")}
              />
              Excluir a lista e todos os cards
            </span>
            <span className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
              Ação irreversível: {cardCount}{" "}
              {cardCount === 1 ? "card" : "cards"} serão apagados.
            </span>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Excluindo..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
