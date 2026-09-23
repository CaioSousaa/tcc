"use client";

import Link from "next/link";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { BOARD_COLOR_HEX, type Board } from "@/lib/boards";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

interface BoardCardProps {
  board: Board;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const isAdmin = board.role === "admin";

  return (
    <article className="overflow-hidden rounded-xl bg-surface shadow-sm">
      <div
        className="h-2.5 w-full"
        style={{ backgroundColor: BOARD_COLOR_HEX[board.color] }}
      />

      <div className="flex min-h-[150px] flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[19px] leading-snug font-semibold">
            <Link
              href={`/quadros/${board.id}`}
              className="transition hover:text-navy"
            >
              {board.title}
            </Link>
          </h2>

          {isAdmin ? (
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(board)}
                aria-label={`Editar quadro ${board.title}`}
                title="Editar"
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:text-foreground"
              >
                <PencilIcon />
              </button>
              <button
                type="button"
                onClick={() => onDelete(board)}
                aria-label={`Excluir quadro ${board.title}`}
                title="Excluir"
                className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger"
              >
                <TrashIcon />
              </button>
            </div>
          ) : null}
        </div>

        <p className="mt-2 text-sm text-muted">
          Criado em {dateFormatter.format(new Date(board.createdAt))}
        </p>

        <span className="mt-auto pt-4 text-right text-[11px] font-semibold tracking-widest text-muted">
          {isAdmin ? "ADMIN" : "MEMBRO"}
        </span>
      </div>
    </article>
  );
}
