"use client";

import { FormEvent, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { List } from "@/lib/lists";
import { Card } from "@/lib/cards";
import { CardItem } from "./CardItem";
import { ListFormModal } from "./ListFormModal";

interface ListColumnProps {
  list: List;
  lists: List[];
  cards: Card[];
  onRename: (name: string) => Promise<void>;
  onReorder: (position: number) => Promise<void>;
  onDelete: () => void;
  onAddCard: (title: string) => Promise<void>;
  onOpenCard: (card: Card) => void;
  onMoveCardUp: (card: Card, index: number) => void;
  onMoveCardDown: (card: Card, index: number) => void;
}

export function ListColumn({
  list,
  lists,
  cards,
  onRename,
  onReorder,
  onDelete,
  onAddCard,
  onOpenCard,
  onMoveCardUp,
  onMoveCardDown,
}: ListColumnProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [creatingCard, setCreatingCard] = useState(false);

  async function handleSave(name: string, position: number) {
    if (name !== list.name) {
      await onRename(name);
    }
    if (position !== list.position) {
      await onReorder(position);
    }
    setShowEditModal(false);
  }

  async function handleAddCard(event: FormEvent) {
    event.preventDefault();
    if (!newCardTitle.trim()) return;

    setCreatingCard(true);
    try {
      await onAddCard(newCardTitle.trim());
      setNewCardTitle("");
      setShowAddCard(false);
    } finally {
      setCreatingCard(false);
    }
  }

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-zinc-100 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
          <span className="truncate">{list.name}</span>
          <span className="shrink-0 text-xs font-normal text-slate-400">{cards.length}</span>
        </span>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => setShowEditModal(true)}
            aria-label="Editar lista"
            className="rounded p-1 text-slate-500 hover:bg-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            aria-label="Excluir lista"
            className="rounded p-1 text-slate-500 hover:bg-red-100 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        {cards.map((card, index) => (
          <CardItem
            key={card.id}
            card={card}
            canMoveUp={index > 0}
            canMoveDown={index < cards.length - 1}
            onOpen={() => onOpenCard(card)}
            onMoveUp={() => onMoveCardUp(card, index)}
            onMoveDown={() => onMoveCardDown(card, index)}
          />
        ))}

        {cards.length === 0 && !showAddCard && (
          <p className="mb-2 rounded-md border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-slate-400">
            Nenhum card ainda
          </p>
        )}

        {showAddCard ? (
          <form onSubmit={handleAddCard}>
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Título do card"
              className="mb-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creatingCard}
                className="rounded-md bg-[#1c3557] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCard(false);
                  setNewCardTitle("");
                }}
                className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-zinc-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-slate-500 hover:bg-zinc-200"
          >
            + Adicionar card
          </button>
        )}
      </div>

      {showEditModal && (
        <ListFormModal
          list={list}
          lists={lists}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
