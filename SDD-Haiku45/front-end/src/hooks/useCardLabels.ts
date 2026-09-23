import { useState, useCallback, useEffect } from "react";

interface Label {
  id: string;
  card_label_id: string;
  name: string;
  color: string;
}

interface UseCardLabelsResult {
  labels: Label[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCardLabels(cardId: string): UseCardLabelsResult {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    if (!cardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/labels`, {
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
  }, [cardId]);

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
