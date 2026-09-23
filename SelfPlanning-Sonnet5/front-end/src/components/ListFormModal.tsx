"use client";

import { FormEvent, useMemo, useState } from "react";
import { GripVertical, X } from "lucide-react";
import { List } from "@/lib/lists";

interface ListFormModalProps {
  list: List;
  lists: List[];
  onSave: (name: string, position: number) => Promise<void>;
  onClose: () => void;
}

export function ListFormModal({ list, lists, onSave, onClose }: ListFormModalProps) {
  const orderedLists = useMemo(() => [...lists].sort((a, b) => a.position - b.position), [lists]);
  const currentIndex = orderedLists.findIndex((l) => l.id === list.id);

  const [name, setName] = useState(list.name);
  const [position, setPosition] = useState(currentIndex >= 0 ? currentIndex : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const withoutCurrent = orderedLists.filter((l) => l.id !== list.id);
    const next = [...withoutCurrent];
    next.splice(position, 0, { ...list, name });
    return next;
  }, [orderedLists, list, name, position]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nome da lista é obrigatório");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(name.trim(), position);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a lista");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Lista</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="list-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Nome da lista
          </label>
          <input
            id="list-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />

          <label htmlFor="list-position" className="mb-1.5 block text-sm font-medium text-slate-700">
            Posição no quadro
          </label>
          <select
            id="list-position"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {orderedLists.map((_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </select>

          <div className="mb-6 space-y-1 rounded-md border border-zinc-200 p-1">
            {preview.map((l) => (
              <div
                key={l.id}
                className={`flex items-center gap-2 rounded px-2 py-2 text-sm ${
                  l.id === list.id ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600"
                }`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-slate-400" />
                {l.name}
              </div>
            ))}
          </div>

          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#1c3557] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar lista"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
