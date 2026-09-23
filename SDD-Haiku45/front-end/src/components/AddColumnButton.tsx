"use client";

import { useState } from "react";

interface AddColumnButtonProps {
  boardId: string;
  onAdd: (name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function AddColumnButton({ boardId, onAdd, loading, error }: AddColumnButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [columnName, setColumnName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!columnName.trim()) {
      return;
    }

    try {
      await onAdd(columnName);
      setColumnName("");
      setShowForm(false);
    } catch (err) {
      // Error handled in parent
    }
  };

  if (showForm) {
    return (
      <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Nome da lista"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-950"
            autoFocus
            disabled={loading}
          />
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !columnName.trim()}
              className="flex-1 px-3 py-2 bg-blue-950 text-white rounded-lg text-sm hover:bg-blue-900 disabled:bg-gray-400"
            >
              {loading ? "Criando..." : "Salvar lista"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setColumnName("");
              }}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 disabled:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-80 rounded-lg p-4 flex items-center justify-center">
      <button
        onClick={() => setShowForm(true)}
        className="text-blue-950 hover:text-blue-900 font-medium text-sm flex items-center gap-2"
      >
        + Adicionar lista
      </button>
    </div>
  );
}
