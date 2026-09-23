import { useState, useCallback } from "react";

interface UseMemberManagementResult {
  invite: (email: string, role: string) => Promise<void>;
  changeRole: (memberId: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useMemberManagement(boardId: string): UseMemberManagementResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = useCallback(
    async (email: string, role: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/boards/${boardId}/members/invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, role }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao convidar membro");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  const changeRole = useCallback(
    async (memberId: string, role: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/members/${memberId}/role`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ role }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao alterar papel"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/members/${memberId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao remover membro"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [boardId]
  );

  return {
    invite,
    changeRole,
    removeMember,
    loading,
    error,
    clearError: () => setError(null),
  };
}
