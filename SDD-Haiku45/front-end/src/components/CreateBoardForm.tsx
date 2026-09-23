"use client";

import { useState } from "react";

const BOARD_COLORS = [
  { name: "Navy", value: "blue-950", hex: "#1f3a5f" },
  { name: "Blue", value: "blue-500", hex: "#3b82f6" },
  { name: "Green", value: "green-500", hex: "#22c55e" },
  { name: "Orange", value: "amber-500", hex: "#f59e0b" },
  { name: "Purple", value: "purple-500", hex: "#9333ea" },
];

interface CreateBoardFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateBoardForm({ onClose, onCreated }: CreateBoardFormProps) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome do quadro é obrigatório");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          color: selectedColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar quadro");
      }

      onCreated();
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
          <h2 className="text-2xl font-bold">Novo quadro</h2>
          <button
            onClick={() => onClose()}
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
            <label className="block text-sm font-medium mb-2">Nome do quadro</label>
            <input
              type="text"
              placeholder="Ex. Sprint 13"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Cor</label>
            <div className="flex gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-10 h-10 rounded-lg transition-all border-2 ${
                    selectedColor === color.value
                      ? "border-gray-800 scale-110"
                      : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => onClose()}
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
              {loading ? "Criando..." : "Criar quadro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
