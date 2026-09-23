"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

/** Envia quem já tem sessão válida direto para a área interna. */
export function useGuestOnly(): { isChecking: boolean } {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuth();

  useEffect(() => {
    if (!isLoadingSession && isAuthenticated) {
      router.replace("/quadros");
    }
  }, [isAuthenticated, isLoadingSession, router]);

  return { isChecking: isLoadingSession || isAuthenticated };
}
