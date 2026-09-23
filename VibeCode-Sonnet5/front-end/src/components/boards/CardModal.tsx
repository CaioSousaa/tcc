"use client";

import { FormEvent, useState } from "react";
import { BoardList } from "@/lib/lists";
import { Card, createCard, updateCard } from "@/lib/cards";
import { attachLabel, detachLabel } from "@/lib/card-labels";
import { LABEL_CHIP_CLASSES } from "@/lib/label-colors";
import { Label } from "@/lib/labels";
import { AssigneesSection } from "./AssigneesSection";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";
import { LabelsModal } from "./LabelsModal";

interface CardModalProps {
  boardId: string;
  lists: BoardList[];
  card: Card | null;
  initialListId: string;
  canManageLabels: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  onRequestDelete: (card: Card) => void;
  onChecklistProgressChange?: (total: number, completed: number) => void;
  onLabelsChange?: (labels: Card["labels"]) => void;
  onLabelCatalogChange?: () => void;
}

export function CardModal({
  boardId,
  lists,
  card,
  initialListId,
  canManageLabels,
  onClose,
  onSaved,
  onRequestDelete,
  onChecklistProgressChange,
  onLabelsChange,
  onLabelCatalogChange,
}: CardModalProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(
    card?.dueDate ? card.dueDate.slice(0, 10) : "",
  );
  const [listId, setListId] = useState(card?.listId ?? initialListId);
  const [cardLabels, setCardLabels] = useState<Card["labels"]>(
    card?.labels ?? [],
  );
  const [managingLabels, setManagingLabels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Título do card é obrigatório.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (card) {
        await updateCard(boardId, card.id, {
          title: title.trim(),
          description,
          listId,
          dueDate: dueDate || null,
        });
      } else {
        await createCard(boardId, {
          title: title.trim(),
          description,
          listId,
          dueDate: dueDate || null,
        });
      }
      await onSaved();
    } catch {
      setError("Não foi possível salvar o card.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {card ? "Editar card" : "Novo card"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-title"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Título
            </label>
            <input
              id="card-title"
              type="text"
              autoFocus
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Descrição
            </label>
            <textarea
              id="card-description"
              rows={3}
              value={description ?? ""}
              onChange={(event) => setDescription(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-due-date"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Prazo
            </label>
            <input
              id="card-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {dueDate && new Date(dueDate) < new Date(new Date().toDateString()) && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Atrasado há{" "}
                {Math.floor(
                  (new Date(new Date().toDateString()).getTime() -
                    new Date(dueDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                dias
              </p>
            )}
          </div>

          {card && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Etiquetas
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {cardLabels.map((label) => (
                  <span
                    key={label.id}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${LABEL_CHIP_CLASSES[label.color]}`}
                  >
                    {label.name}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setManagingLabels(true)}
                  className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400"
                >
                  Gerenciar etiquetas
                </button>
              </div>
            </div>
          )}

          {card && <AssigneesSection boardId={boardId} cardId={card.id} />}

          {card && (
            <ChecklistSection
              boardId={boardId}
              cardId={card.id}
              onProgressChange={onChecklistProgressChange}
            />
          )}

          {card && <CommentsSection boardId={boardId} cardId={card.id} />}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-list"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Lista
            </label>
            <select
              id="card-list"
              value={listId}
              onChange={(event) => setListId(event.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            {card ? (
              <button
                type="button"
                onClick={() => onRequestDelete(card)}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Excluir card
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Salvando..." : "Salvar card"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {managingLabels && card && (
        <LabelsModal
          boardId={boardId}
          canManage={canManageLabels}
          cardId={card.id}
          appliedLabelIds={cardLabels.map((label) => label.id)}
          onClose={() => setManagingLabels(false)}
          onLabelsChanged={onLabelCatalogChange}
          onToggleLabel={async (label: Label, checked) => {
            if (checked) {
              await attachLabel(boardId, card.id, label.id);
              setCardLabels((prev) => {
                const next = [...prev, label];
                onLabelsChange?.(next);
                return next;
              });
            } else {
              await detachLabel(boardId, card.id, label.id);
              setCardLabels((prev) => {
                const next = prev.filter((item) => item.id !== label.id);
                onLabelsChange?.(next);
                return next;
              });
            }
          }}
        />
      )}
    </div>
  );
}
