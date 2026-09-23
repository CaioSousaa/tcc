"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** Bloqueia a área interna enquanto não houver sessão válida. */
export function useRequireAuth(): { isChecking: boolean } {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuth();

  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoadingSession, router]);

  return { isChecking: isLoadingSession || !isAuthenticated };
}
