import { useState, useCallback } from "react";

interface BoardMember {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface UseMembersResult {
  members: BoardMember[];
  invitations: Invitation[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMembers(boardId: string): UseMembersResult {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!boardId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/boards/${boardId}/members`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar membros");
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  return {
    members,
    invitations,
    loading,
    error,
    refetch: fetchMembers,
  };
}
