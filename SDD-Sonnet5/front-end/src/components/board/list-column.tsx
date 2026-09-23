"use client";

import { FormEvent, useState } from "react";
import { IconButton, Button } from "@/components/ui/button";
import { CardItem } from "@/components/board/card-item";
import { Card } from "@/lib/cards/api";
import { List } from "@/lib/lists/api";

export function ListColumn({
  list,
  cards,
  commentCounts,
  onOpenCard,
  onCreateCard,
  creatingCard,
  onEditList,
  onDeleteList,
}: {
  list: List;
  cards: Card[];
  commentCounts: Record<string, number>;
  onOpenCard: (card: Card) => void;
  onCreateCard: (title: string) => Promise<void>;
  creatingCard: boolean;
  onEditList: () => void;
  onDeleteList: () => void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await onCreateCard(newTitle);
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-black/3 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">{list.name}</h3>
          <span className="text-xs text-muted">{cards.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            type="button"
            variant="ghost"
            onClick={onEditList}
            aria-label={`Editar lista ${list.name}`}
            title="Editar lista"
          >
            ✎
          </IconButton>
          <IconButton
            type="button"
            variant="ghost"
            onClick={onDeleteList}
            aria-label={`Excluir lista ${list.name}`}
            title="Excluir lista"
          >
            🗑
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            commentCount={commentCounts[card.id]}
            onOpen={() => onOpenCard(card)}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="+ Adicionar card"
          className="w-full rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted focus:border-brand focus:bg-surface focus:outline-none"
        />
        {newTitle.trim() && (
          <Button type="submit" disabled={adding || creatingCard} className="self-start">
            {adding || creatingCard ? "Adicionando..." : "Adicionar card"}
          </Button>
        )}
      </form>
    </div>
  );
}

export function AddListColumn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-fit w-72 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand"
    >
      + Adicionar lista
    </button>
  );
}
