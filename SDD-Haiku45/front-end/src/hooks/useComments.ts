import { useState, useCallback, useEffect } from "react";

interface CommentData {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
}

interface UseCommentsResult {
  comments: CommentData[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useComments(cardId: string): UseCommentsResult {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!cardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setComments(data.comments || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    total,
    loading,
    error,
    refetch: fetchComments,
  };
}
