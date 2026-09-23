"use client";

import { DragEvent } from "react";
import { Card } from "@/lib/cards";
import { LABEL_CHIP_CLASSES } from "@/lib/label-colors";

function formatDueDate(value: string): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function daysOverdue(value: string): number {
  const due = new Date(new Date(value).toDateString());
  const today = new Date(new Date().toDateString());
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

interface CardItemProps {
  card: Card;
  isDragging: boolean;
  onOpen: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

export function CardItem({
  card,
  isDragging,
  onOpen,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CardItemProps) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(event);
      }}
      onDragOver={(event) => {
        event.stopPropagation();
        onDragOver(event);
      }}
      onDrop={(event) => {
        event.stopPropagation();
        onDrop(event);
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 text-sm shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {card.labels.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LABEL_CHIP_CLASSES[label.color]}`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      <p className="font-medium text-zinc-900 dark:text-zinc-50">
        {card.title}
      </p>
      {card.description && (
        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {card.description}
        </p>
      )}
      {card.checklistTotal > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-1.5 rounded-full bg-emerald-500"
              style={{
                width: `${Math.round(
                  (card.checklistCompleted / card.checklistTotal) * 100,
                )}%`,
              }}
            />
          </div>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
            {card.checklistCompleted}/{card.checklistTotal}
          </span>
        </div>
      )}
      {(card.dueDate || card.assignees.length > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {card.dueDate ? (
            daysOverdue(card.dueDate) > 0 ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                ⏰ Atrasado há {daysOverdue(card.dueDate)}{" "}
                {daysOverdue(card.dueDate) === 1 ? "dia" : "dias"}
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                ⏰ Vence {formatDueDate(card.dueDate)}
              </span>
            )
          ) : (
            <span />
          )}

          {card.assignees.length > 0 && (
            <div className="flex justify-end gap-1">
              {card.assignees.map((assignee) => (
                <span
                  key={assignee.userId}
                  title={assignee.name}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white"
                >
                  {initials(assignee.name)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
