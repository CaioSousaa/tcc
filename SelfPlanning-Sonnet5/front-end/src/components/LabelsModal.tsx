"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Label, LABEL_COLOR_CLASSES, LABEL_COLORS, LabelColor } from "@/lib/labels";

interface LabelsModalProps {
  boardId: string;
  cardId?: string;
  appliedLabelIds?: string[];
  onChange?: (labels: Label[]) => void;
  onLabelCreated?: (label: Label) => void;
  onLabelDeleted?: (labelId: string) => void;
  onClose: () => void;
}

export function LabelsModal({
  boardId,
  cardId,
  appliedLabelIds = [],
  onChange,
  onLabelCreated,
  onLabelDeleted,
  onClose,
}: LabelsModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set(appliedLabelIds));
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<LabelColor>("red");
  const [creating, setCreating] = useState(false);

  const manageOnly = !cardId;

  useEffect(() => {
    api.get(`/boards/${boardId}/labels`).then((response) => {
      setLabels(response.data);
      setLoading(false);
    });
  }, [boardId]);

  async function handleToggle(label: Label) {
    if (!cardId) return;
    const isApplied = applied.has(label.id);
    const next = new Set(applied);

    if (isApplied) {
      next.delete(label.id);
      setApplied(next);
      await api.delete(`/boards/${boardId}/cards/${cardId}/labels/${label.id}`);
    } else {
      next.add(label.id);
      setApplied(next);
      await api.post(`/boards/${boardId}/cards/${cardId}/labels`, { labelId: label.id });
    }

    onChange?.(labels.filter((l) => next.has(l.id)));
  }

  async function handleDeleteLabel(label: Label) {
    setLabels((prev) => prev.filter((l) => l.id !== label.id));
    await api.delete(`/boards/${boardId}/labels/${label.id}`);
    onLabelDeleted?.(label.id);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post(`/boards/${boardId}/labels`, {
        name: newName.trim(),
        color: newColor,
      });
      const created = { ...response.data, cardCount: 0 };
      setLabels((prev) => [...prev, created]);
      onLabelCreated?.(created);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Etiquetas do quadro</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {manageOnly
            ? "Gerencie as etiquetas do quadro ou crie uma nova."
            : "Marque as etiquetas aplicadas a este card ou crie uma nova."}
        </p>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando etiquetas...</p>
        ) : (
          <div className="mb-5 space-y-1">
            {labels.map((label) =>
              manageOnly ? (
                <div
                  key={label.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <span className={`h-3 w-3 rounded-full ${LABEL_COLOR_CLASSES[label.color]}`} />
                  <span className="flex-1 text-sm text-slate-800">{label.name}</span>
                  {label.cardCount !== undefined && (
                    <span className="text-xs text-slate-400">{label.cardCount}</span>
                  )}
                  <button
                    onClick={() => handleDeleteLabel(label)}
                    aria-label="Excluir etiqueta"
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label
                  key={label.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={applied.has(label.id)}
                    onChange={() => handleToggle(label)}
                    className="h-4 w-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500"
                  />
                  <span className={`h-3 w-3 rounded-full ${LABEL_COLOR_CLASSES[label.color]}`} />
                  <span className="flex-1 text-sm text-slate-800">{label.name}</span>
                  {label.cardCount !== undefined && (
                    <span className="text-xs text-slate-400">{label.cardCount}</span>
                  )}
                </label>
              )
            )}
            {labels.length === 0 && (
              <p className="px-2 py-1 text-sm text-slate-400">Nenhuma etiqueta criada ainda</p>
            )}
          </div>
        )}

        <div className="rounded-md border border-zinc-200 p-3">
          <p className="mb-2 text-sm font-medium text-slate-700">Nova etiqueta</p>
          <form onSubmit={handleCreate} className="mb-2 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={creating}
              className="shrink-0 rounded-md bg-[#1c3557] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
            >
              Criar
            </button>
          </form>
          <div className="flex gap-2">
            {LABEL_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                aria-label={color}
                className={`h-6 w-6 rounded-full ${LABEL_COLOR_CLASSES[color]} ${
                  newColor === color ? "ring-2 ring-offset-2 ring-slate-500" : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-[#1c3557] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162a46]"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}
