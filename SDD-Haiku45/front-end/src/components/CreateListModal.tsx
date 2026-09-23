"use client";

import { useState } from "react";

interface CreateListModalProps {
  boardId: string;
  position?: number;
  onClose: () => void;
  onListCreated?: () => void;
}

const DEFAULT_POSITIONS = ["Backlog", "A fazer", "Em progresso", "Revisão", "Concluído"];

export function CreateListModal({ boardId, position = 0, onClose, onListCreated }: CreateListModalProps) {
  const [name, setName] = useState("");
  const [selectedPosition, setSelectedPosition] = useState(position.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome da lista é obrigatório");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/boards/${boardId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          position: parseInt(selectedPosition),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar lista");
      }

      onListCreated?.();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Lista</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Nome da lista</label>
            <input
              type="text"
              placeholder="Em progresso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Posição no quadro</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
            >
              {DEFAULT_POSITIONS.map((pos, idx) => (
                <option key={idx} value={idx}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:bg-gray-400"
            >
              {loading ? "Salvando..." : "Salvar lista"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
