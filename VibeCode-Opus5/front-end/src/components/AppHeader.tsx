"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/initials";

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="flex items-center justify-between gap-6 px-6 py-3.5">
        <BrandMark size="sm" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-semibold text-white">
              {getInitials(user?.name ?? "")}
            </span>
            <span className="text-[15px] font-medium">{user?.name}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:text-foreground disabled:opacity-60"
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  );
}
