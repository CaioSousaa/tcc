"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { ChecklistItem } from "@/lib/checklist";

interface ChecklistSectionProps {
  boardId: string;
  cardId: string;
  onProgressChange?: (done: number, total: number) => void;
}

export function ChecklistSection({ boardId, cardId, onProgressChange }: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);

  const basePath = `/boards/${boardId}/cards/${cardId}/checklist-items`;

  useEffect(() => {
    let active = true;
    api.get(basePath).then((response) => {
      if (active) {
        setItems(response.data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  async function handleAddItem(event: FormEvent) {
    event.preventDefault();
    if (!newItemText.trim()) return;

    setAdding(true);
    try {
      const response = await api.post(basePath, { text: newItemText.trim() });
      setItems((prev) => [...prev, response.data]);
      setNewItemText("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
    );
    await api.patch(`${basePath}/${item.id}`, { done: !item.done });
  }

  async function handleDelete(item: ChecklistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await api.delete(`${basePath}/${item.id}`);
  }

  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  useEffect(() => {
    if (!loading) onProgressChange?.(done, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, done, total]);

  if (loading) {
    return <p className="mb-4 text-sm text-slate-400">Carregando checklist...</p>;
  }

  return (
    <div className="mb-6">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Checklist</span>
        {total > 0 && (
          <span className="text-xs text-slate-500">
            {done}/{total} concluídos
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mb-2 space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="group flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => handleToggle(item)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span
              className={`flex-1 text-sm ${
                item.done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {item.text}
            </span>
            <button
              onClick={() => handleDelete(item)}
              aria-label="Excluir item"
              className="rounded p-0.5 text-slate-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddItem} className="flex gap-2">
        <input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="+ Adicionar item"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-md bg-[#1c3557] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#162a46] disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}
