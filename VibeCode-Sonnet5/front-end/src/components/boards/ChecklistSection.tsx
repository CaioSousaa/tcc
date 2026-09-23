"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import {
  ChecklistItem,
  createChecklistItem,
  deleteChecklistItem,
  fetchChecklistItems,
  updateChecklistItem,
} from "@/lib/checklist";

interface ChecklistSectionProps {
  boardId: string;
  cardId: string;
  onProgressChange?: (total: number, completed: number) => void;
}

export function ChecklistSection({
  boardId,
  cardId,
  onProgressChange,
}: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchChecklistItems(boardId, cardId)
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar o checklist.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  useEffect(() => {
    const completed = items.filter((item) => item.completed).length;
    onProgressChange?.(items.length, completed);
  }, [items, onProgressChange]);

  async function handleToggle(item: ChecklistItem) {
    const previous = items;
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? { ...current, completed: !current.completed }
          : current,
      ),
    );
    try {
      await updateChecklistItem(boardId, cardId, item.id, {
        completed: !item.completed,
      });
    } catch {
      setItems(previous);
      setError("Não foi possível atualizar o item.");
    }
  }

  async function handleDelete(itemId: string) {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    try {
      await deleteChecklistItem(boardId, cardId, itemId);
    } catch {
      setItems(previous);
      setError("Não foi possível remover o item.");
    }
  }

  async function handleAddItem() {
    if (!newItemText.trim()) return;

    setAdding(true);
    try {
      const item = await createChecklistItem(
        boardId,
        cardId,
        newItemText.trim(),
      );
      setItems((prev) => [...prev, item]);
      setNewItemText("");
    } catch {
      setError("Não foi possível adicionar o item.");
    } finally {
      setAdding(false);
    }
  }

  const completed = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Checklist
        </span>
        {items.length > 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {completed}/{items.length} concluídos
          </span>
        )}
      </div>

      {items.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-1.5 rounded-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Carregando checklist...
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggle(item)}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span
                className={`flex-1 text-sm ${
                  item.completed
                    ? "text-zinc-400 line-through dark:text-zinc-600"
                    : "text-zinc-800 dark:text-zinc-200"
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                aria-label="Remover item"
                onClick={() => handleDelete(item.id)}
                className="invisible text-xs text-zinc-400 hover:text-red-600 group-hover:visible"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={newItemText}
          disabled={adding}
          onChange={(event) => setNewItemText(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleAddItem();
            }
          }}
          placeholder="+ Adicionar item"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
        <button
          type="button"
          onClick={handleAddItem}
          disabled={adding || !newItemText.trim()}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
