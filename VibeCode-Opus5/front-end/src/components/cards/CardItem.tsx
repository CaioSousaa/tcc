"use client";

import { Avatar } from "@/components/Avatar";
import { ChecklistProgressBar } from "@/components/checklists/ChecklistProgressBar";
import { ClockIcon, TrashIcon } from "@/components/icons";
import { LabelChip } from "@/components/labels/LabelChip";
import type { BoardMember } from "@/lib/board-members";
import type { BoardCard } from "@/lib/cards";
import { getDueDateStatus } from "@/lib/due-date";
import type { Label } from "@/lib/labels";

interface CardItemProps {
  card: BoardCard;
  checklistDone: number;
  checklistTotal: number;
  assignees: BoardMember[];
  labels: Label[];
  isDragging: boolean;
  isDropTarget: boolean;
  onEdit: (card: BoardCard) => void;
  onDelete: (card: BoardCard) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
}

export function CardItem({
  card,
  checklistDone,
  checklistTotal,
  assignees,
  labels,
  isDragging,
  isDropTarget,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
}: CardItemProps) {
  return (
    <article
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        // Firefox only starts a drag when some data is set.
        event.dataTransfer.setData("text/plain", card.id);
        onDragStart();
      }}
      onDragEnter={(event) => {
        event.stopPropagation();
        onDragEnter();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDrop();
      }}
      onDragEnd={(event) => {
        event.stopPropagation();
        onDragEnd();
      }}
      onClick={() => onEdit(card)}
      className={`group flex cursor-pointer flex-col gap-1 rounded-lg border border-line bg-background p-3 text-left shadow-sm transition ${
        isDragging ? "opacity-50" : ""
      } ${isDropTarget ? "ring-2 ring-navy/40" : ""}`}
    >
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <LabelChip key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium">
          {card.title}
        </p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(card);
          }}
          aria-label={`Excluir card ${card.title}`}
          title="Excluir"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 transition hover:border hover:border-danger hover:text-danger group-hover:opacity-100"
        >
          <TrashIcon />
        </button>
      </div>

      {card.description ? (
        <p className="line-clamp-2 text-sm text-muted">{card.description}</p>
      ) : null}

      {checklistTotal > 0 ? (
        <ChecklistProgressBar done={checklistDone} total={checklistTotal} />
      ) : null}

      {card.dueDate || assignees.length > 0 ? (
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {card.dueDate ? <DueDateChip dueDate={card.dueDate} /> : <span />}

          {assignees.length > 0 ? (
            <div className="flex -space-x-2">
              {assignees.map((member) => (
                <Avatar
                  key={member.id}
                  seed={member.userId ?? member.email}
                  name={member.name}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function DueDateChip({ dueDate }: { dueDate: string }) {
  const status = getDueDateStatus(dueDate);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        status.isOverdue ? "bg-danger/10 text-danger" : "text-muted"
      }`}
    >
      <ClockIcon />
      {status.label}
    </span>
  );
}
