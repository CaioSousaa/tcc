import Link from "next/link";
import { TagIcon } from "@/components/labels/icons";
import { AvatarStack } from "@/components/members/AvatarStack";
import { PeopleIcon } from "@/components/members/icons";
import { boardColorHex } from "@/lib/boardColors";
import { BOARD_AVATARS_MAX } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import { can } from "@/lib/permissions";
import type { BoardDetail } from "@/services/boardService";
import { ChevronLeftIcon, PencilIcon } from "./icons";

type Props = { board: BoardDetail; onEdit: () => void; onOpenMembers: () => void; onOpenLabels: () => void };

/**
 * Header from prototipo/paginas/quadro.png (RF02 spec 2.3). Since RF07: "Membros"
 * and up to 4 avatars on the right; editing only for administrators (spec 2.2).
 * Since RF08: "Etiquetas" before "Membros", only for administrators (RF08 spec 2.1).
 */
export function BoardHeader({ board, onEdit, onOpenMembers, onOpenLabels }: Props) {
  return (
    <div className="flex min-h-[72px] flex-wrap items-center gap-5 border-b border-line bg-white px-6 py-3 lg:px-8">
      <Link href="/boards" className="flex items-center gap-1 text-[15px] text-muted transition hover:text-ink">
        <ChevronLeftIcon />
        Quadros
      </Link>
      <span aria-hidden="true" className="h-6 w-px bg-line" />
      <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: boardColorHex(board.color) }} />
      <h1 className="min-w-0 truncate text-xl font-bold text-ink" title={board.name}>
        {board.name}
      </h1>
      {can(board.myRole, "board.update") ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar quadro ${board.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-ink transition hover:bg-surface"
        >
          <PencilIcon />
        </button>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {can(board.myRole, "labels.manage") ? (
          <button
            type="button"
            onClick={onOpenLabels}
            className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[15px] text-ink transition hover:bg-surface"
          >
            <TagIcon />
            {MESSAGES.labelsButton}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onOpenMembers}
          className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-4 text-[15px] text-ink transition hover:bg-surface"
        >
          <PeopleIcon />
          Membros
        </button>
        <AvatarStack people={board.members} max={BOARD_AVATARS_MAX} />
      </div>
    </div>
  );
}
