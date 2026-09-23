"use client";

import { createContext, useCallback, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  userRole: string | null;
  boardId: string | null;
  setCurrentBoard: (boardId: string) => Promise<void>;
  hasRole: (requiredRole: string) => boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session check failed:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const setCurrentBoard = useCallback(async (newBoardId: string) => {
    setBoardId(newBoardId);
    try {
      const response = await fetch(`/api/boards/${newBoardId}/members`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const userMember = data.members?.find(
          (m: any) => m.user_id === user?.id
        );
        setUserRole(userMember?.role || null);
      } else {
        setUserRole(null);
      }
    } catch (err) {
      console.error("Failed to fetch user role:", err);
      setUserRole(null);
    }
  }, [user?.id]);

  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      if (!userRole) return false;
      const roles = ["viewer", "editor", "admin"];
      const roleIndex = roles.indexOf(userRole);
      const requiredIndex = roles.indexOf(requiredRole);
      return roleIndex >= requiredIndex;
    },
    [userRole]
  );

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setUser(null);
        setUserRole(null);
        setBoardId(null);
      }
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    setUser,
    userRole,
    boardId,
    setCurrentBoard,
    hasRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
