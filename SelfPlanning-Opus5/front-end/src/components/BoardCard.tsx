"use client";

import Link from "next/link";
import { BOARD_COLOR_HEX } from "@/lib/boardColors";
import { Board } from "@/lib/boardsApi";

interface BoardCardProps {
  board: Board;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  return (
    <article className="overflow-hidden rounded-xl bg-surface shadow-sm">
      <div className="h-2 w-full" style={{ backgroundColor: BOARD_COLOR_HEX[board.color] }} />

      <div className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-snug text-foreground">
            <Link href={`/quadros/${board.id}`} className="transition-colors hover:text-brand">
              {board.name}
            </Link>
          </h2>

          <div className={`flex shrink-0 gap-2 ${board.role === "admin" ? "" : "hidden"}`}>
            <button
              type="button"
              onClick={() => onEdit(board)}
              aria-label={`Editar ${board.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-foreground"
            >
              ✎
            </button>
            <button
              type="button"
              onClick={() => onDelete(board)}
              aria-label={`Excluir ${board.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-red-700"
            >
              🗑
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {board.listCount} {board.listCount === 1 ? "lista" : "listas"} · {board.cardCount}{" "}
            {board.cardCount === 1 ? "card" : "cards"}
            {board.overdueCount > 0
              ? ` · ${board.overdueCount} ${
                  board.overdueCount === 1 ? "atrasado" : "atrasados"
                }`
              : ""}
          </span>
          <span className="text-xs font-semibold tracking-widest text-muted">
            {board.role === "admin" ? "ADMIN" : "MEMBRO"}
          </span>
        </div>
      </div>
    </article>
  );
}
