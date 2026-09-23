import { useState, useCallback } from "react";

interface UseCommentFormResult {
  content: string;
  setContent: (content: string) => void;
  submit: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  reset: () => void;
}

export function useCommentForm(
  onSubmit: (content: string) => Promise<void>
): UseCommentFormResult {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (!content.trim()) {
      setError("Comment content is required");
      return;
    }

    if (content.length > 1000) {
      setError("Comment must not exceed 1000 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit comment");
    } finally {
      setLoading(false);
    }
  }, [content, onSubmit]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setContent("");
    setError(null);
  }, []);

  return {
    content,
    setContent,
    submit,
    loading,
    error,
    clearError,
    reset,
  };
}
