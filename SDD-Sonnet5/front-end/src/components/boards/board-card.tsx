"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { Board } from "@/lib/boards/api";
import { BoardSummary, fetchBoardSummary } from "@/lib/boards/summary";
import { getBoardColor } from "@/lib/ui/board-colors";

export function BoardCard({
  board,
  onEdit,
  onDelete,
}: {
  board: Board;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [summary, setSummary] = useState<BoardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBoardSummary(board.id)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        // Estatísticas são um extra visual; a navegação para o quadro continua funcionando sem elas.
      });
    return () => {
      cancelled = true;
    };
  }, [board.id]);

  const parts = summary
    ? [
        `${summary.listCount} lista${summary.listCount === 1 ? "" : "s"}`,
        `${summary.cardCount} card${summary.cardCount === 1 ? "" : "s"}`,
        ...(summary.overdueCount > 0 ? [`${summary.overdueCount} atrasado${summary.overdueCount === 1 ? "" : "s"}`] : []),
      ]
    : [];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5" style={{ backgroundColor: getBoardColor(board.id) }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/quadros/${board.id}`} className="flex-1">
            <h3 className="font-semibold text-foreground hover:underline">{board.name}</h3>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <IconButton
              type="button"
              onClick={onEdit}
              aria-label={`Editar ${board.name}`}
              title="Editar quadro"
            >
              ✎
            </IconButton>
            <IconButton
              type="button"
              variant="danger"
              onClick={onDelete}
              aria-label={`Excluir ${board.name}`}
              title="Excluir quadro"
            >
              🗑
            </IconButton>
          </div>
        </div>

        <Link href={`/quadros/${board.id}`} className="flex-1">
          <p className="text-sm text-muted">
            {parts.length > 0 ? parts.join(" · ") : "Carregando..."}
          </p>
        </Link>

        <div className="mt-auto flex items-center justify-between pt-2">
          {summary && summary.members.length > 0 ? (
            <AvatarStack
              people={summary.members.map((m) => ({ id: m.userId, name: m.name }))}
              size="sm"
            />
          ) : (
            <span />
          )}
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {board.role}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CreateBoardCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted transition-colors hover:border-brand hover:text-brand"
    >
      <span className="text-2xl leading-none">+</span>
      <span className="text-sm font-medium">Criar quadro</span>
    </button>
  );
}
