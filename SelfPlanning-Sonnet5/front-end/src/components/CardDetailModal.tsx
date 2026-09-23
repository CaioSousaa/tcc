"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Card } from "@/lib/cards";
import { List } from "@/lib/lists";
import { Label, LABEL_COLOR_CHIP_CLASSES } from "@/lib/labels";
import { ChecklistSection } from "./ChecklistSection";
import { AssigneesSection } from "./AssigneesSection";
import { CommentsSection } from "./CommentsSection";
import { LabelsModal } from "./LabelsModal";

interface CardDetailModalProps {
  boardId: string;
  card: Card;
  lists: List[];
  onSave: (
    title: string,
    description: string | null,
    listId: string,
    dueDate: string | null
  ) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  onLabelsChange: (labels: Label[]) => void;
  onLabelCreated?: (label: Label) => void;
  onChecklistChange?: (done: number, total: number) => void;
}

export function CardDetailModal({
  boardId,
  card,
  lists,
  onSave,
  onDelete,
  onClose,
  onLabelsChange,
  onLabelCreated,
  onChecklistChange,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [listId, setListId] = useState(card.listId);
  const [dueDate, setDueDate] = useState(
    card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 10) : ""
  );
  const [labels, setLabels] = useState<Label[]>(card.labels ?? []);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleLabelsChange(updated: Label[]) {
    setLabels(updated);
    onLabelsChange(updated);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Título é obrigatório");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(
        title.trim(),
        description.trim() ? description.trim() : null,
        listId,
        dueDate ? dueDate : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o card");
      setSaving(false);
    }
  }

  const currentListName = lists.find((l) => l.id === card.listId)?.name ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Card · {currentListName}
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="card-description"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Descrição
            </label>
            <textarea
              id="card-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição..."
              className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />

            <ChecklistSection
              boardId={boardId}
              cardId={card.id}
              onProgressChange={onChecklistChange}
            />

            <CommentsSection boardId={boardId} cardId={card.id} />
          </div>

          <div className="w-full shrink-0 md:w-64">
            <label htmlFor="card-list" className="mb-1.5 block text-sm font-medium text-slate-700">
              Lista
            </label>
            <select
              id="card-list"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="mb-6 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>

            <div className="mb-6">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Etiquetas</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${LABEL_COLOR_CHIP_CLASSES[label.color]}`}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setShowLabelsModal(true)}
                className="mt-2 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Gerenciar etiquetas
              </button>
            </div>

            <AssigneesSection boardId={boardId} cardId={card.id} />

            <label
              htmlFor="card-due-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Prazo
            </label>
            <div className="mb-6">
              <input
                id="card-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              {card.isOverdue && (
                <p className="mt-2 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                  Atrasado há {card.overdueDays} {card.overdueDays === 1 ? "dia" : "dias"}
                </p>
              )}
            </div>

            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

            <div className="space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-md bg-[#1c3557] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar card"}
              </button>
              <button
                onClick={onDelete}
                className="w-full rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Excluir card
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLabelsModal && (
        <LabelsModal
          boardId={boardId}
          cardId={card.id}
          appliedLabelIds={labels.map((label) => label.id)}
          onChange={handleLabelsChange}
          onLabelCreated={onLabelCreated}
          onClose={() => setShowLabelsModal(false)}
        />
      )}
    </div>
  );
}
