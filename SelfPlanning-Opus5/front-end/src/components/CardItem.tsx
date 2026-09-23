"use client";

import { DragEvent } from "react";
import { Avatar } from "./Avatar";
import { LabelChip } from "./LabelChip";
import { Card } from "@/lib/cardsApi";
import { describeDueDate } from "@/lib/dueDate";

interface CardItemProps {
  card: Card;
  isDragging: boolean;
  onOpen: (card: Card) => void;
  onDragStart: (card: Card) => void;
  onDragEnd: () => void;
  onDropOn: (card: Card) => void;
}

export function CardItem({
  card,
  isDragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onDropOn,
}: CardItemProps) {


  function handleDragStart(event: DragEvent<HTMLDivElement>): void {
    event.stopPropagation();
    onDragStart(card);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    onDropOn(card);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onClick={() => onOpen(card)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(card);
        }
      }}
      className={`flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-background px-3 py-3 text-left transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {card.labels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <LabelChip key={label.id} name={label.name} color={label.color} />
          ))}
        </div>
      ) : null}

      <p className="text-sm font-medium leading-snug text-foreground">{card.title}</p>

      {card.checklistTotal > 0 ? (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: `${Math.round((card.checklistDone / card.checklistTotal) * 100)}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted">
            {card.checklistDone}/{card.checklistTotal}
          </span>
        </div>
      ) : null}

      {card.commentCount > 0 ? (
        <span className="text-xs text-muted">💬 {card.commentCount}</span>
      ) : null}

      {card.assignees.length > 0 ? (
        <div className="flex -space-x-1.5">
          {card.assignees.map((assignee) => (
            <Avatar
              key={assignee.memberId}
              name={assignee.name}
              email={assignee.email}
              size="sm"
            />
          ))}
        </div>
      ) : null}

      {card.dueDate ? (
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-xs ${
            card.dueStatus === "overdue"
              ? "bg-red-50 text-red-700"
              : card.dueStatus === "today"
                ? "bg-amber-50 text-amber-700"
                : "bg-surface text-muted"
          }`}
        >
          {describeDueDate(card.dueDate)}
        </span>
      ) : null}
    </div>
  );
}
