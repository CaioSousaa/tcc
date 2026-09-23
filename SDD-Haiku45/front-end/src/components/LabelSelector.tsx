"use client";

import { useState } from "react";
import { useLabels } from "@/hooks/useLabels";
import { useCardLabelManagement } from "@/hooks/useCardLabelManagement";

interface LabelSelectorProps {
  boardId: string;
  cardId: string;
  canEdit?: boolean;
  excludeIds?: string[];
  onApply?: () => Promise<void>;
}

export default function LabelSelector({
  boardId,
  cardId,
  canEdit = false,
  excludeIds = [],
  onApply,
}: LabelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { labels: allLabels, loading: labelsLoading } = useLabels(boardId);
  const labels = allLabels.filter((l) => !excludeIds.includes(l.id));
  const { applyLabel, loading: applyLoading, error } = useCardLabelManagement(
    boardId,
    cardId
  );

  const handleSelectLabel = async (labelId: string) => {
    try {
      await applyLabel(labelId);
      setIsOpen(false);
      if (onApply) {
        await onApply();
      }
    } catch (err) {
      console.error("Falha ao aplicar etiqueta", err);
    }
  };

  if (!canEdit) {
    return null;
  }

  if (labelsLoading) {
    return <div className="text-sm text-gray-500">Carregando etiquetas...</div>;
  }

  if (labels.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Nenhuma etiqueta disponível. Use "Gerenciar etiquetas" para criar.
      </div>
    );
  }

  return (
    <div className="relative">
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm mb-2">
          {error}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 text-sm"
        disabled={applyLoading}
      >
        + Adicionar Etiqueta
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-64 overflow-y-auto">
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => handleSelectLabel(label.id)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-l-4"
              style={{ borderLeftColor: label.color }}
              disabled={applyLoading}
            >
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: label.color }}
              ></span>
              {label.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
