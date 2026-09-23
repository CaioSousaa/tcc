"use client";

import { DragEvent, ReactNode } from "react";
import { BoardList } from "@/lib/lists";

interface ListColumnProps {
  list: BoardList;
  isDragging: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onCardDropToEnd: () => void;
  children?: ReactNode;
}

export function ListColumn({
  list,
  isDragging,
  canManage,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onCardDropToEnd,
  children,
}: ListColumnProps) {
  return (
    <div
      draggable={canManage}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <h3
          className={`truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50 ${canManage ? "cursor-grab" : ""}`}
        >
          {list.title}
        </h3>

        {canManage && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Editar lista"
              onClick={onEdit}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              ✎
            </button>
            <button
              type="button"
              aria-label="Excluir lista"
              onClick={onDelete}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={(event) => {
          event.stopPropagation();
          onCardDropToEnd();
        }}
        className="flex flex-1 flex-col gap-2"
      >
        {children}
      </div>
    </div>
  );
}
