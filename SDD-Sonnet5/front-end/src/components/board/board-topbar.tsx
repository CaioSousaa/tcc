"use client";

import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { Button, IconButton } from "@/components/ui/button";
import { Board } from "@/lib/boards/api";
import { Member } from "@/lib/boards-members/api";

export function BoardTopBar({
  board,
  members,
  onEditBoard,
  onOpenLabels,
  onOpenMembers,
}: {
  board: Board;
  members: Member[];
  onEditBoard: () => void;
  onOpenLabels: () => void;
  onOpenMembers: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-6 py-3 sm:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          ← Quadros
        </Link>
        <span className="text-border">|</span>
        <h1 className="truncate text-lg font-semibold text-foreground">{board.name}</h1>
        {board.role === "administrador" && (
          <IconButton
            type="button"
            variant="ghost"
            onClick={onEditBoard}
            aria-label="Editar quadro"
            title="Editar quadro"
          >
            ✎
          </IconButton>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onOpenLabels}>
          🏷 Etiquetas
        </Button>
        <Button type="button" variant="outline" onClick={onOpenMembers}>
          👥 Membros
        </Button>
        <AvatarStack people={members.map((m) => ({ id: m.userId, name: m.name }))} size="sm" />
      </div>
    </header>
  );
}
