"use client";

import { DragEvent } from "react";
import { CardItem } from "./CardItem";
import { Card } from "@/lib/cardsApi";
import { BoardList } from "@/lib/listsApi";

interface BoardColumnProps {
  list: BoardList;
  cards: Card[];
  isDragging: boolean;
  draggedCardId: string | null;
  canManageLists: boolean;
  onEdit: (list: BoardList) => void;
  onDelete: (list: BoardList) => void;
  onDragStart: (list: BoardList) => void;
  onDragEnd: () => void;
  onDropOn: (list: BoardList) => void;
  onAddCard: (list: BoardList) => void;
  onOpenCard: (card: Card) => void;
  onCardDragStart: (card: Card) => void;
  onCardDragEnd: () => void;
  onCardDropOnCard: (card: Card) => void;
  onCardDropOnList: (list: BoardList) => void;
}

export function BoardColumn({
  list,
  cards,
  isDragging,
  draggedCardId,
  canManageLists,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropOn,
  onAddCard,
  onOpenCard,
  onCardDragStart,
  onCardDragEnd,
  onCardDropOnCard,
  onCardDropOnList,
}: BoardColumnProps) {
  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();

    if (draggedCardId) {
      onCardDropOnList(list);
      return;
    }

    onDropOn(list);
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(list)}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex w-72 shrink-0 cursor-grab flex-col gap-3 rounded-xl bg-surface p-4 shadow-sm transition-opacity active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {list.name}
          <span className="text-xs font-normal text-muted">{cards.length}</span>
        </h2>

        <div className={`flex shrink-0 gap-2 ${canManageLists ? "" : "hidden"}`}>
          <button
            type="button"
            onClick={() => onEdit(list)}
            aria-label={`Editar ${list.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-foreground"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => onDelete(list)}
            aria-label={`Excluir ${list.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-red-700"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isDragging={draggedCardId === card.id}
            onOpen={onOpenCard}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
            onDropOn={onCardDropOnCard}
          />
        ))}

        {cards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-xs text-muted">
            Nenhum card nesta lista
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onAddCard(list)}
        className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted transition-colors hover:border-brand hover:text-foreground"
      >
        + Adicionar card
      </button>
    </div>
  );
}
