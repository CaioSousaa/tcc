import { useState, useCallback, useEffect } from "react";

interface UseCardLabelFilterResult {
  selectedLabelIds: string[];
  toggleLabel: (labelId: string) => void;
  clearFilter: () => void;
}

export function useCardLabelFilter(boardId: string): UseCardLabelFilterResult {
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const storageKey = `filter_labels_${boardId}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSelectedLabelIds(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Falha ao carregar filtro de etiquetas", err);
    }
  }, [boardId, storageKey]);

  const toggleLabel = useCallback(
    (labelId: string) => {
      setSelectedLabelIds((prev) => {
        let updated: string[];
        if (prev.includes(labelId)) {
          updated = prev.filter((id) => id !== labelId);
        } else {
          updated = [...prev, labelId];
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (err) {
          console.error("Falha ao salvar filtro de etiquetas", err);
        }
        return updated;
      });
    },
    [storageKey]
  );

  const clearFilter = useCallback(() => {
    setSelectedLabelIds([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error("Falha ao limpar filtro de etiquetas", err);
    }
  }, [storageKey]);

  return {
    selectedLabelIds,
    toggleLabel,
    clearFilter,
  };
}
