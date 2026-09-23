"use client";

import { DragEvent, FormEvent, useState } from "react";
import { BoardList, createList, renameList, reorderLists } from "@/lib/lists";

const NEW_LIST_PLACEHOLDER = "__new__";

interface ListModalProps {
  boardId: string;
  lists: BoardList[];
  target: BoardList | "create";
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function ListModal({
  boardId,
  lists,
  target,
  onClose,
  onSaved,
}: ListModalProps) {
  const targetId = target === "create" ? NEW_LIST_PLACEHOLDER : target.id;

  const [name, setName] = useState(target === "create" ? "" : target.title);
  const [order, setOrder] = useState<string[]>(() =>
    target === "create"
      ? [...lists.map((item) => item.id), NEW_LIST_PLACEHOLDER]
      : lists.map((item) => item.id),
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const listsById = new Map(lists.map((item) => [item.id, item]));

  function labelFor(id: string): string {
    if (id === targetId) return name.trim() || "(sem nome)";
    return listsById.get(id)?.title ?? "";
  }

  function moveTo(id: string, newIndex: number) {
    setOrder((prev) => {
      const next = prev.filter((item) => item !== id);
      next.splice(newIndex, 0, id);
      return next;
    });
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDrop(dropTargetId: string) {
    if (!draggedId || draggedId === dropTargetId) return;
    const dropIndex = order.indexOf(dropTargetId);
    moveTo(draggedId, dropIndex);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nome da lista é obrigatório.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      let finalOrder = order;

      if (target === "create") {
        const created = await createList(boardId, name.trim());
        finalOrder = order.map((id) => (id === targetId ? created.id : id));
      } else if (name.trim() !== target.title) {
        await renameList(boardId, target.id, name.trim());
      }

      await reorderLists(boardId, finalOrder);
      await onSaved();
    } catch {
      setError("Não foi possível salvar a lista.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Lista
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
              htmlFor="list-name"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Nome da lista
            </label>
            <input
              id="list-name"
              type="text"
              autoFocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="list-position"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Posição no quadro
            </label>
            <select
              id="list-position"
              value={order.indexOf(targetId)}
              onChange={(event) =>
                moveTo(targetId, Number(event.target.value))
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {order.map((_, index) => (
                <option key={index} value={index}>
                  {index + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 p-1.5 dark:border-zinc-800">
            {order.map((id) => (
              <div
                key={id}
                draggable
                onDragStart={() => setDraggedId(id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(id)}
                onDragEnd={() => setDraggedId(null)}
                className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${
                  id === targetId
                    ? "bg-slate-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400"
                } ${draggedId === id ? "opacity-40" : ""}`}
              >
                <span className="cursor-grab text-zinc-400">≡</span>
                {labelFor(id)}
              </div>
            ))}
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
              {submitting ? "Salvando..." : "Salvar lista"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
