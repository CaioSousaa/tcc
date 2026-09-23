import { useState, useCallback, useEffect } from "react";

interface ChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  is_completed: boolean;
  position: number;
}

interface ChecklistData {
  id: string;
  card_id: string;
  items: ChecklistItem[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface UseChecklistResult {
  checklist: ChecklistData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createChecklist: () => Promise<void>;
}

export function useChecklist(
  cardId: string,
  boardId: string
): UseChecklistResult {
  const [checklist, setChecklist] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklist = useCallback(async () => {
    if (!cardId || !boardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/checklist`,
        {
          credentials: "include",
        }
      );

      if (response.status === 404) {
        setChecklist(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setChecklist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load checklist");
      setChecklist(null);
    } finally {
      setLoading(false);
    }
  }, [cardId, boardId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  const createChecklist = useCallback(async () => {
    if (!cardId || !boardId) return;

    setError(null);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/checklist`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setChecklist(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create checklist"
      );
    }
  }, [cardId, boardId]);

  return {
    checklist,
    loading,
    error,
    refetch: fetchChecklist,
    createChecklist,
  };
}
