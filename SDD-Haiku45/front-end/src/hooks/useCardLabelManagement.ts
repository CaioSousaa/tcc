import { useState, useCallback } from "react";

interface UseCardLabelManagementResult {
  applyLabel: (labelId: string) => Promise<void>;
  removeLabel: (cardLabelId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCardLabelManagement(
  boardId: string,
  cardId: string
): UseCardLabelManagementResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyLabel = useCallback(
    async (labelId: string) => {
      if (!boardId || !cardId) throw new Error("boardId e cardId são obrigatórios");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/labels`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ label_id: labelId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao aplicar etiqueta";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, cardId]
  );

  const removeLabel = useCallback(
    async (cardLabelId: string) => {
      if (!boardId || !cardId) throw new Error("boardId e cardId são obrigatórios");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/labels/${cardLabelId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao remover etiqueta";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId, cardId]
  );

  return {
    applyLabel,
    removeLabel,
    loading,
    error,
    clearError: () => setError(null),
  };
}
