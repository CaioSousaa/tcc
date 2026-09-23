import { useState, useCallback, useEffect } from "react";

interface Label {
  id: string;
  name: string;
  color: string;
  card_count: number;
  created_at: string;
  updated_at: string;
}

interface UseLabelsResult {
  labels: Label[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLabels(boardId: string): UseLabelsResult {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/labels`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setLabels(data.labels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar etiquetas");
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return {
    labels,
    loading,
    error,
    refetch: fetchLabels,
  };
}
