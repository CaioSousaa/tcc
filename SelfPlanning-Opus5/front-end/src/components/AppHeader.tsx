"use client";

import { Logo } from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";

  return `${first}${last}`.toUpperCase();
}

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between gap-6 border-b border-border bg-surface px-6 py-3">
      <Logo />

      <input
        type="search"
        placeholder="Buscar quadros e cards"
        className="hidden h-10 w-full max-w-md rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-brand md:block"
      />

      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {user ? initialsOf(user.name) : ""}
        </span>
        <span className="hidden text-sm font-medium text-foreground sm:block">{user?.name}</span>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
