import { useState, useCallback, useEffect } from "react";

interface Assignee {
  id: string;
  member_id: string;
  member_name: string;
  member_role: string;
  assigned_at: string;
}

interface UseAssigneesResult {
  assignees: Assignee[];
  loading: boolean;
  error: string | null;
  addAssignee: (boardMemberId: string) => Promise<void>;
  removeAssignee: (assignmentId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useAssignees(cardId: string, boardId: string = ""): UseAssigneesResult {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignees = useCallback(async () => {
    if (!cardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/assignees`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setAssignees(data.assignees || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Falha ao carregar responsáveis"
      );
      setAssignees([]);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchAssignees();
  }, [fetchAssignees]);

  const addAssignee = useCallback(
    async (boardMemberId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/boards/${boardId}/cards/${cardId}/assignees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ board_member_id: boardMemberId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        await fetchAssignees();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao adicionar responsável"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cardId, boardId, fetchAssignees]
  );

  const removeAssignee = useCallback(
    async (assignmentId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/assignees/${assignmentId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        await fetchAssignees();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Falha ao remover responsável"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAssignees]
  );

  return {
    assignees,
    loading,
    error,
    addAssignee,
    removeAssignee,
    refetch: fetchAssignees,
  };
}
