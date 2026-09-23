"use client";

import Link from "next/link";
import { AvatarStack } from "@/components/members/AvatarStack";
import { boardColorHex } from "@/lib/boardColors";
import { BOARD_AVATARS_MAX, roleBadge } from "@/lib/members";
import { can } from "@/lib/permissions";
import { boardCountsLabel } from "@/lib/plural";
import type { BoardSummary } from "@/services/boardService";
import { PencilIcon, TrashIcon } from "./icons";

type Props = {
  board: BoardSummary;
  onEdit: (board: BoardSummary) => void;
  onDelete: (board: BoardSummary) => void;
};

const actionClass =
  "relative z-10 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * The whole card opens the board; edit and delete are separate buttons layered
 * above the link, so they never trigger navigation (N40). Since RF07 the card also
 * shows avatars and the role badge, and edit/delete only for administrators (C166).
 */
export function BoardCard({ board, onEdit, onDelete }: Props) {
  const canEdit = can(board.myRole, "board.update");
  const canDelete = can(board.myRole, "board.delete");

  return (
    <article className="relative flex h-full min-h-[188px] flex-col overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div aria-hidden="true" className="h-1.5 shrink-0" style={{ backgroundColor: boardColorHex(board.color) }} />
      <div className="flex flex-1 flex-col gap-3 px-5 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 break-words text-xl font-medium leading-snug text-ink [overflow-wrap:anywhere]">
            <Link
              href={`/boards/${board.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand"
            >
              {board.name}
            </Link>
          </h2>
          {canEdit || canDelete ? (
            <div className="flex shrink-0 gap-2">
              {canEdit ? (
                <button type="button" aria-label={`Editar quadro ${board.name}`} onClick={() => onEdit(board)} className={actionClass}>
                  <PencilIcon />
                </button>
              ) : null}
              {canDelete ? (
                <button type="button" aria-label={`Excluir quadro ${board.name}`} onClick={() => onDelete(board)} className={actionClass}>
                  <TrashIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="text-[15px] text-muted">{boardCountsLabel(board.listCount, board.cardCount, board.overdueCount)}</p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <AvatarStack people={board.memberPreview} max={BOARD_AVATARS_MAX} total={board.memberCount} />
          <span className="font-mono text-xs tracking-widest text-muted">{roleBadge(board.myRole)}</span>
        </div>
      </div>
    </article>
  );
}
