"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { LABEL_DOT_CLASSES } from "@/lib/label-colors";
import {
  LABEL_COLORS,
  Label,
  LabelColor,
  createLabel,
  deleteLabel,
  fetchLabels,
} from "@/lib/labels";

interface LabelsModalProps {
  boardId: string;
  canManage: boolean;
  cardId?: string;
  appliedLabelIds?: string[];
  onClose: () => void;
  onToggleLabel?: (label: Label, checked: boolean) => Promise<void>;
  onLabelsChanged?: () => void;
}

export function LabelsModal({
  boardId,
  canManage,
  cardId,
  appliedLabelIds,
  onClose,
  onToggleLabel,
  onLabelsChanged,
}: LabelsModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [applied, setApplied] = useState<Set<string>>(
    new Set(appliedLabelIds ?? []),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("red");
  const [creating, setCreating] = useState(false);

  const loadLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLabels(await fetchLabels(boardId));
    } catch {
      setError("Não foi possível carregar as etiquetas.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  async function handleToggle(label: Label) {
    if (!onToggleLabel) return;
    const checked = !applied.has(label.id);

    setApplied((prev) => {
      const next = new Set(prev);
      if (checked) next.add(label.id);
      else next.delete(label.id);
      return next;
    });

    try {
      await onToggleLabel(label, checked);
    } catch {
      setApplied((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(label.id);
        else next.add(label.id);
        return next;
      });
      setError("Não foi possível atualizar a etiqueta do card.");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const label = await createLabel(boardId, {
        name: newName.trim(),
        color: newColor,
      });
      setLabels((prev) => [...prev, label]);
      setNewName("");
      onLabelsChanged?.();
    } catch {
      setError("Não foi possível criar a etiqueta.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(labelId: string) {
    const previous = labels;
    setLabels((prev) => prev.filter((label) => label.id !== labelId));
    try {
      await deleteLabel(boardId, labelId);
      onLabelsChanged?.();
    } catch {
      setLabels(previous);
      setError("Não foi possível excluir a etiqueta.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Etiquetas do quadro
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

        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {cardId
            ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
            : "Crie e organize as etiquetas deste quadro."}
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Carregando etiquetas...
            </p>
          ) : (
            labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                {cardId && (
                  <input
                    type="checkbox"
                    checked={applied.has(label.id)}
                    onChange={() => handleToggle(label)}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                )}
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${LABEL_DOT_CLASSES[label.color]}`}
                />
                <span className="flex-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {label.name}
                </span>
                <span className="text-xs text-zinc-400">{label.cardCount}</span>
                {canManage && (
                  <button
                    type="button"
                    aria-label={`Excluir etiqueta ${label.name}`}
                    onClick={() => handleDelete(label.id)}
                    className="text-zinc-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {canManage && (
          <div className="mt-5 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nova etiqueta
            </span>
            <form onSubmit={handleCreate} className="mt-2 flex gap-2">
              <input
                type="text"
                value={newName}
                disabled={creating}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Nome"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Criar
              </button>
            </form>
            <div className="mt-2 flex gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => setNewColor(color)}
                  className={`h-7 w-7 rounded-full ${LABEL_DOT_CLASSES[color]} ${
                    newColor === color
                      ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100"
                      : ""
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
