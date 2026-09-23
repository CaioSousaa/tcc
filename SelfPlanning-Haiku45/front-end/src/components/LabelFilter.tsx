import { useState, useEffect } from "react";
import { getLabels } from "@/lib/api";

interface Label {
  id: string;
  nome: string;
  cor: string;
}

interface LabelFilterProps {
  boardId: string;
  onFilterChange: (labelIds: string[]) => void;
}

const dotColorMap: Record<string, string> = {
  vermelho: "bg-red-500",
  azul: "bg-blue-500",
  verde: "bg-emerald-500",
  amarelo: "bg-yellow-500",
  roxo: "bg-purple-500",
  rosa: "bg-pink-500",
  laranja: "bg-orange-500",
  cinza: "bg-gray-500",
};

export default function LabelFilter({ boardId, onFilterChange }: LabelFilterProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadLabels = async () => {
      try {
        const res = await getLabels(boardId);
        setLabels(res.data);
      } catch (err) {
        console.error("Erro ao carregar etiquetas", err);
      }
    };

    loadLabels();
  }, [boardId]);

  const handleToggleLabel = (labelId: string) => {
    const newSelected = new Set(selectedLabels);
    if (newSelected.has(labelId)) {
      newSelected.delete(labelId);
    } else {
      newSelected.add(labelId);
    }
    setSelectedLabels(newSelected);
    onFilterChange(Array.from(newSelected));
  };

  const handleClearFilter = () => {
    setSelectedLabels(new Set());
    onFilterChange([]);
  };

  if (labels.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500 mr-1">Filtrar por etiqueta</span>
      <button
        onClick={handleClearFilter}
        className={`px-3 py-1.5 text-sm font-medium rounded-full transition ${
          selectedLabels.size === 0
            ? "bg-blue-950 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Todas
      </button>
      {labels.map((label) => {
        const active = selectedLabels.has(label.id);
        return (
          <button
            key={label.id}
            onClick={() => handleToggleLabel(label.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition ${
              active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${dotColorMap[label.cor] || dotColorMap.cinza}`} />
            {label.nome}
          </button>
        );
      })}
    </div>
  );
}
