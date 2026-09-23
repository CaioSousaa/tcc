"use client";

import { useState, useEffect } from "react";
import { Board } from "@/hooks/useBoardApi";

interface BoardFormProps {
  board?: Board;
  onSubmit: (data: { title: string; description?: string; color?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export const BoardForm: React.FC<BoardFormProps> = ({ board, onSubmit, onCancel, isLoading = false }) => {
  const [title, setTitle] = useState(board?.title || "");
  const [description, setDescription] = useState(board?.description || "");
  const [color, setColor] = useState(board?.color || "#3B82F6");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Título é obrigatório");
      return;
    }

    try {
      await onSubmit({ title, description, color });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar quadro";
      setError(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {board ? "Editar Quadro" : "Novo Quadro"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meu novo quadro"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
            <div className="flex gap-3">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${
                    color === c ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-900 text-white font-semibold py-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
