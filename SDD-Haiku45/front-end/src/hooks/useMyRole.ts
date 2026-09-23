import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

interface UseMyRoleResult {
  role: string | null;
  loading: boolean;
  hasRole: (requiredRole: string) => boolean;
}

export function useMyRole(boardId: string): UseMyRoleResult {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!boardId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/boards/${boardId}/members`, {
        credentials: "include",
      });

      if (!response.ok) {
        setRole(null);
        return;
      }

      // Get current user's role from members list
      const data = await response.json();

      const userMember = data.members?.find(
        (m: any) => m.user_id === user?.id
      );
      setRole(userMember?.role || null);
    } catch (err) {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [boardId, user?.id]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      if (!role) return false;
      const roles = ["viewer", "editor", "admin"];
      const roleIndex = roles.indexOf(role);
      const requiredIndex = roles.indexOf(requiredRole);
      return roleIndex >= requiredIndex;
    },
    [role]
  );

  return {
    role,
    loading,
    hasRole,
  };
}
