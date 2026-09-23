import { useState } from "react";

interface DueDateManagementState {
  loading: boolean;
  error: string | null;
}

export function useDueDateManagement(
  listId: string,
  cardId: string,
  onSuccess?: () => void
): DueDateManagementState & {
  setDueDate: (dueDate: string) => Promise<void>;
  removeDueDate: () => Promise<void>;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDueDate = async (dueDate: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lists/${listId}/cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ due_date: dueDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao definir data de vencimento");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeDueDate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lists/${listId}/cards/${cardId}/due-date`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao remover data de vencimento");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setDueDate,
    removeDueDate,
  };
}
