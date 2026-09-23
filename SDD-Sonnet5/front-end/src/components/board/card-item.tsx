"use client";

import { Avatar } from "@/components/ui/avatar";
import { LabelBadge } from "@/components/ui/label-badge";
import { Card } from "@/lib/cards/api";
import { dueDateLabel } from "@/lib/ui/due-date";

export function CardItem({
  card,
  commentCount,
  onOpen,
}: {
  card: Card;
  commentCount?: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <LabelBadge key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-foreground">{card.title}</p>

      {card.progress && card.progress.total > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full bg-green-700"
              style={{ width: `${card.progress.percentage}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-muted">
            {card.progress.completed}/{card.progress.total}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {card.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                card.dueDateStatus === "overdue"
                  ? "bg-red-100 text-red-700"
                  : card.dueDateStatus === "due_soon"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-black/5 text-muted"
              }`}
            >
              🕐 {dueDateLabel(card.dueDate, card.dueDateStatus)}
            </span>
          )}
          {commentCount != null && commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
              💬 {commentCount}
            </span>
          )}
        </div>
        {card.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {card.assignees.map((assignee) => (
              <Avatar key={assignee.userId} id={assignee.userId} name={assignee.name} size="sm" />
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
