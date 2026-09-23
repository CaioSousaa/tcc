"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/initials";
import { BoardSearch } from "./BoardSearch";
import { Logo } from "./Logo";

/** Logo, board search (only in "Meus quadros"), who is signed in (CA22) and sign-out (CA21). */
export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [leaving, setLeaving] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    if (leaving) return;
    setLeaving(true);
    await logout();
  }

  return (
    <header className="flex h-[78px] items-center justify-between gap-4 border-b border-line bg-white px-6 lg:px-10">
      <Logo compact />
      <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
        {pathname === "/boards" ? <BoardSearch /> : null}
        <div className="flex shrink-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-avatar text-sm font-semibold text-white"
          >
            {initials(user.name)}
          </span>
          <span className="hidden text-[15px] text-ink sm:inline" data-testid="current-user-name">
            {user.name}
          </span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={leaving}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
        >
          {leaving ? "Saindo..." : "Sair"}
        </button>
      </div>
    </header>
  );
}
