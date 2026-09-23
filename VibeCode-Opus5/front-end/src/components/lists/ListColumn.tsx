"use client";

import { CardItem } from "@/components/cards/CardItem";
import { DragHandleIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import type { CardAssignee } from "@/lib/card-assignees";
import type { CardLabel } from "@/lib/card-labels";
import type { BoardCard } from "@/lib/cards";
import type { ChecklistItem } from "@/lib/checklist-items";
import type { Label } from "@/lib/labels";
import type { BoardList } from "@/lib/lists";
import type { BoardMember } from "@/lib/board-members";

interface ListColumnProps {
  list: BoardList;
  cards: BoardCard[];
  checklistItems: ChecklistItem[];
  cardAssignees: CardAssignee[];
  members: BoardMember[];
  cardLabels: CardLabel[];
  labels: Label[];
  isAdmin: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onEdit: (list: BoardList) => void;
  onDelete: (list: BoardList) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  isCardDragActive: boolean;
  draggingCardId: string | null;
  cardDropTargetId: string | null;
  onAddCard: (list: BoardList) => void;
  onEditCard: (card: BoardCard) => void;
  onDeleteCard: (card: BoardCard) => void;
  onCardDragStart: (card: BoardCard) => void;
  onCardDragEnter: (cardId: string) => void;
  onCardDragEnd: () => void;
  onCardDrop: (beforeCardId: string | null) => void;
}

export function ListColumn({
  list,
  cards,
  checklistItems,
  cardAssignees,
  members,
  cardLabels,
  labels,
  isAdmin,
  isDragging,
  isDropTarget,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDrop,
  isCardDragActive,
  draggingCardId,
  cardDropTargetId,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onCardDragStart,
  onCardDragEnter,
  onCardDragEnd,
  onCardDrop,
}: ListColumnProps) {
  return (
    <section
      draggable={isAdmin}
      onDragStart={(event) => {
        if (!isAdmin) {
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        // Firefox only starts a drag when some data is set.
        event.dataTransfer.setData("text/plain", list.id);
        onDragStart();
      }}
      onDragEnter={() => {
        if (isAdmin && !isCardDragActive) {
          onDragEnter();
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (isAdmin && !isCardDragActive) {
          onDrop();
        }
      }}
      onDragEnd={onDragEnd}
      aria-label={`Lista ${list.title}`}
      className={`flex w-[300px] shrink-0 flex-col rounded-xl bg-surface p-4 shadow-sm transition ${
        isDragging ? "opacity-50" : ""
      } ${isDropTarget ? "ring-2 ring-navy/40" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="cursor-grab text-muted" title="Arraste para reordenar">
            <DragHandleIcon />
          </span>
          <h2 className="truncate text-[17px] font-semibold">{list.title}</h2>
          <span className="shrink-0 text-sm text-muted">{cards.length}</span>
        </div>

        {isAdmin ? (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(list)}
              aria-label={`Renomear lista ${list.title}`}
              title="Renomear"
              className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:text-foreground"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(list)}
              aria-label={`Excluir lista ${list.title}`}
              title="Excluir"
              className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:border-danger hover:text-danger"
            >
              <TrashIcon />
            </button>
          </div>
        ) : null}
      </header>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onCardDrop(null);
        }}
        className="mt-4 flex flex-1 flex-col gap-2"
      >
        {cards.length === 0 ? (
          <div className="grid min-h-[80px] flex-1 place-items-center rounded-lg border border-dashed border-line text-sm text-muted">
            Sem cards ainda
          </div>
        ) : (
          cards.map((card) => {
            const cardChecklistItems = checklistItems.filter(
              (item) => item.cardId === card.id,
            );
            const assignees = cardAssignees
              .filter((assignee) => assignee.cardId === card.id)
              .map((assignee) =>
                members.find((member) => member.userId === assignee.userId),
              )
              .filter((member): member is BoardMember => Boolean(member));
            const cardLabelChips = cardLabels
              .filter((cardLabel) => cardLabel.cardId === card.id)
              .map((cardLabel) =>
                labels.find((label) => label.id === cardLabel.labelId),
              )
              .filter((label): label is Label => Boolean(label));

            return (
            <CardItem
              key={card.id}
              card={card}
              checklistDone={
                cardChecklistItems.filter((item) => item.done).length
              }
              checklistTotal={cardChecklistItems.length}
              assignees={assignees}
              labels={cardLabelChips}
              isDragging={draggingCardId === card.id}
              isDropTarget={
                cardDropTargetId === card.id && draggingCardId !== card.id
              }
              onEdit={onEditCard}
              onDelete={onDeleteCard}
              onDragStart={() => onCardDragStart(card)}
              onDragEnter={() => onCardDragEnter(card.id)}
              onDragEnd={onCardDragEnd}
              onDrop={() => onCardDrop(card.id)}
            />
            );
          })
        )}
      </div>

      <button
        type="button"
        onClick={() => onAddCard(list)}
        className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-line py-2 text-sm text-muted transition hover:border-navy hover:text-foreground"
      >
        <PlusIcon />
        Adicionar card
      </button>
    </section>
  );
}
