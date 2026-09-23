import { useState, useCallback } from "react";

interface UseLabelManagementResult {
  createLabel: (name: string, color: string) => Promise<void>;
  updateLabel: (labelId: string, name: string, color: string) => Promise<void>;
  deleteLabel: (labelId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useLabelManagement(boardId: string): UseLabelManagementResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLabel = useCallback(
    async (name: string, color: string) => {
      if (!boardId) throw new Error("boardId é obrigatório");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/boards/${boardId}/labels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, color }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao criar etiqueta";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  const updateLabel = useCallback(
    async (labelId: string, name: string, color: string) => {
      if (!boardId) throw new Error("boardId é obrigatório");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/boards/${boardId}/labels/${labelId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, color }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao editar etiqueta";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  const deleteLabel = useCallback(
    async (labelId: string) => {
      if (!boardId) throw new Error("boardId é obrigatório");

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/boards/${boardId}/labels/${labelId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Falha ao deletar etiqueta";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  return {
    createLabel,
    updateLabel,
    deleteLabel,
    loading,
    error,
    clearError: () => setError(null),
  };
}
