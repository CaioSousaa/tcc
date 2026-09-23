"use client";

import Link from "next/link";
import { BOARD_COLOR_BORDER_CLASSES } from "@/lib/board-colors";
import { Board } from "@/lib/boards";

interface BoardCardProps {
  board: Board;
  onEdit: () => void;
  onDelete: () => void;
}

const ROLE_LABELS = {
  owner: "ADMIN",
  admin: "ADMIN",
  member: "MEMBRO",
} as const;

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const createdAt = new Date(board.createdAt).toLocaleDateString("pt-BR");
  const canManage = board.role === "owner" || board.role === "admin";

  return (
    <div
      className={`relative rounded-xl border-t-4 border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${BOARD_COLOR_BORDER_CLASSES[board.color]}`}
    >
      {canManage && (
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            type="button"
            aria-label="Editar quadro"
            onClick={onEdit}
            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ✎
          </button>
          {board.role === "owner" && (
            <button
              type="button"
              aria-label="Excluir quadro"
              onClick={onDelete}
              className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              🗑
            </button>
          )}
        </div>
      )}

      <Link href={`/boards/${board.id}`} className="block pr-16">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {board.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Criado em {createdAt}
          </p>
          <span className="text-xs font-medium tracking-wide text-zinc-400 dark:text-zinc-500">
            {ROLE_LABELS[board.role]}
          </span>
        </div>
      </Link>
    </div>
  );
}
