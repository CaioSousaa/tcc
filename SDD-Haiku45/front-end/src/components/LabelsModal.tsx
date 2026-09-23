"use client";

import { useState, useEffect } from "react";

interface LabelsModalProps {
  boardId: string;
  onClose: () => void;
}

const LABEL_COLORS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Verde", value: "#22c55e" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cinza", value: "#6b7280" },
];

interface Label {
  id: string;
  name: string;
  color: string;
}

export function LabelsModal({ boardId, onClose }: LabelsModalProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0].value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLabels();
  }, [boardId]);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boards/${boardId}/labels`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLabels(data.labels ?? []);
      }
    } catch (err) {
      console.error("Erro ao carregar etiquetas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome da etiqueta é obrigatório");
      return;
    }

    try {
      const response = await fetch(`/api/boards/${boardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), color }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar etiqueta");
      }

      await fetchLabels();
      setName("");
      setColor(LABEL_COLORS[0].value);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta etiqueta?")) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/labels/${labelId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar etiqueta");
      }

      await fetchLabels();
    } catch (err) {
      console.error("Erro ao deletar etiqueta:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Etiquetas</h2>
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

        <form onSubmit={handleAddLabel} className="mb-6 pb-6 border-b">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Criar etiqueta</label>
            <input
              type="text"
              placeholder="Nome da etiqueta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm mb-2"
            />
            <div className="flex gap-2 mb-4">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    color === c.value ? "border-gray-800 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 text-sm"
            >
              Criar etiqueta
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Carregando etiquetas...</div>
        ) : (
          <div className="space-y-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="text-sm font-medium">{label.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}

            {labels.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhuma etiqueta criada ainda
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
