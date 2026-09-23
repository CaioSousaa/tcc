import { useState } from "react";

interface UseCommentManagementResult {
  createComment: (content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useCommentManagement(
  boardId: string,
  cardId: string,
  onSuccess?: () => Promise<void>
): UseCommentManagementResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createComment = async (content: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      if (onSuccess) await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create comment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateComment = async (commentId: string, content: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      if (onSuccess) await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/cards/${cardId}/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (onSuccess) await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createComment,
    updateComment,
    deleteComment,
    loading,
    error,
  };
}
