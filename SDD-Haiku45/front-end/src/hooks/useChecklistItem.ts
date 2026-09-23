import { useState, useCallback } from "react";

interface UseChecklistItemResult {
  addItem: (title: string) => Promise<void>;
  updateItem: (itemId: string, data: { title?: string; is_completed?: boolean }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useChecklistItem(
  cardId: string,
  boardId: string,
  checklistId: string | null,
  onSuccess?: () => Promise<void>
): UseChecklistItemResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback(
    async (title: string) => {
      if (!cardId || !boardId || !checklistId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/checklist/items`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (onSuccess) {
          await onSuccess();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add item");
      } finally {
        setLoading(false);
      }
    },
    [cardId, boardId, checklistId, onSuccess]
  );

  const updateItem = useCallback(
    async (itemId: string, data: { title?: string; is_completed?: boolean }) => {
      if (!cardId || !boardId || !checklistId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/checklist/items/${itemId}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (onSuccess) {
          await onSuccess();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update item");
      } finally {
        setLoading(false);
      }
    },
    [cardId, boardId, checklistId, onSuccess]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cardId || !boardId || !checklistId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/checklist/items/${itemId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (onSuccess) {
          await onSuccess();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove item");
      } finally {
        setLoading(false);
      }
    },
    [cardId, boardId, checklistId, onSuccess]
  );

  return {
    addItem,
    updateItem,
    removeItem,
    loading,
    error,
  };
}
