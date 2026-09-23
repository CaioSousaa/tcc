"use client";

import { useState, FormEvent } from "react";
import { ChecklistProgress } from "./ChecklistProgress";

interface ChecklistItem {
  id: string;
  titulo: string;
  concluido: boolean;
  ordem: number;
}

interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
}

interface CardChecklistProps {
  items: ChecklistItem[];
  progress: ChecklistProgress;
  onAddItem: (titulo: string) => Promise<void>;
  onToggleItem: (itemId: string, concluido: boolean) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  loading?: boolean;
}

export function CardChecklist({
  items,
  progress,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  loading = false,
}: CardChecklistProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  async function handleAddItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    try {
      await onAddItem(newItemTitle);
      setNewItemTitle("");
      setShowAddForm(false);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Checklist</h3>
        {progress.total > 0 && (
          <span className="text-xs text-gray-400">{progress.completed}/{progress.total} concluídos</span>
        )}
      </div>

      <ChecklistProgress
        completed={progress.completed}
        total={progress.total}
        percentage={progress.percentage}
      />

      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.concluido}
              onChange={(e) => onToggleItem(item.id, e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <span
              className={`flex-1 text-sm ${
                item.concluido ? "line-through text-gray-400" : "text-gray-900"
              }`}
            >
              {item.titulo}
            </span>
            <button
              onClick={() => onDeleteItem(item.id)}
              className="text-xs px-2 py-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddItem} className="mt-3 flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            maxLength={200}
            placeholder="Novo item..."
            autoFocus
            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white text-sm rounded-lg"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setNewItemTitle("");
            }}
            className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 w-full py-2 text-sm text-gray-500 border border-dashed border-gray-300 hover:border-gray-400 hover:text-gray-700 rounded-lg transition"
        >
          + Adicionar item
        </button>
      )}
    </div>
  );
}
