"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "./AppHeader";

/** Renders protected content only after the API confirmed the session (C18, F7). */
export function ProtectedShell({ children }: { children: ReactNode }) {
  const { status, retry } = useAuth();

  if (status === "authenticated") {
    return (
      <div className="flex min-h-screen flex-1 flex-col bg-surface">
        <AppHeader />
        {children}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <p className="text-[15px] text-ink">Não foi possível concluir a operação. Tente novamente.</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-1 items-center justify-center bg-surface">
      <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
      <span className="sr-only">Carregando</span>
    </div>
  );
}
