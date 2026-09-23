import { useState, useEffect } from "react";

interface DueDateState {
  dueDate: string | null;
  status: "no_due" | "due_today" | "due_soon" | "overdue";
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDueDate(listId: string, cardId: string): DueDateState {
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"no_due" | "due_today" | "due_soon" | "overdue">("no_due");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStatus = (date: string | null) => {
    if (!date) {
      setStatus("no_due");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDay = new Date(date);
    dueDay.setHours(0, 0, 0, 0);

    const diffTime = dueDay.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      setStatus("overdue");
    } else if (diffDays === 0) {
      setStatus("due_today");
    } else if (diffDays <= 7) {
      setStatus("due_soon");
    } else {
      setStatus("no_due");
    }
  };

  const fetchDueDate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/lists/${listId}/cards/${cardId}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar data de vencimento");
      }

      const data = await response.json();
      setDueDate(data.card?.due_date || null);
      calculateStatus(data.card?.due_date || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDueDate();
  }, [listId, cardId]);

  return {
    dueDate,
    status,
    loading,
    error,
    refetch: fetchDueDate,
  };
}
