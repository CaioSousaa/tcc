"use client";

import { FormEvent, useState } from "react";
import { AssigneesSection } from "./AssigneesSection";
import { LabelChip } from "./LabelChip";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";
import { Modal } from "./Modal";
import { FormMessage } from "./FormMessage";
import { TextField } from "./TextField";
import { Card, CardPayload } from "@/lib/cardsApi";
import { BoardList } from "@/lib/listsApi";
import { BoardMember, CardAssignee } from "@/lib/membersApi";
import { describeDueDate } from "@/lib/dueDate";
import { getErrorMessage } from "@/lib/errors";

interface CardDetailModalProps {
  card?: Card;
  boardId: string;
  listId: string;
  lists: BoardList[];
  onChecklistProgressChange?: (cardId: string, total: number, done: number) => void;
  members: BoardMember[];
  onAssigneesChange?: (cardId: string, assignees: CardAssignee[]) => void;
  onManageLabels?: (card: Card) => void;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onCommentCountChange?: (cardId: string, count: number) => void;
  onClose: () => void;
  onSubmit: (data: CardPayload & { listId: string }) => Promise<void>;
  onRequestDelete?: (card: Card) => void;
}

/** Mesmo modal cria um card e edita um card existente, incluindo a troca de lista. */
export function CardDetailModal({
  card,
  boardId,
  listId,
  lists,
  onClose,
  onSubmit,
  onRequestDelete,
  onChecklistProgressChange,
  members,
  onAssigneesChange,
  onManageLabels,
  currentUserId = null,
  isAdmin = false,
  onCommentCountChange,
}: CardDetailModalProps) {
  const isEditing = card !== undefined;

  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.dueDate ?? "");
  const [selectedListId, setSelectedListId] = useState(card?.listId ?? listId);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentListName =
    lists.find((item) => item.id === (card?.listId ?? listId))?.name ?? "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() === "" ? null : description.trim(),
        dueDate: dueDate === "" ? null : dueDate,
        listId: selectedListId,
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Não foi possível salvar o card."));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`CARD · ${currentListName.toUpperCase()}`} onClose={onClose}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Título"
          placeholder="Ex.: Refatorar componente de filtros"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-description" className="text-sm text-foreground">
            Descrição
          </label>
          <textarea
            id="card-description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalhe o que precisa ser feito"
            className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-list" className="text-sm text-foreground">
            Lista
          </label>
          <select
            id="card-list"
            value={selectedListId}
            onChange={(event) => setSelectedListId(event.target.value)}
            className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm text-foreground outline-none focus:border-brand"
          >
            {lists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {card && onManageLabels ? (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Etiquetas</h3>

            <div className="flex flex-wrap items-center gap-2">
              {card.labels.map((label) => (
                <LabelChip key={label.id} name={label.name} color={label.color} />
              ))}

              {card.labels.length === 0 ? (
                <span className="text-xs text-muted">Nenhuma etiqueta aplicada.</span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onManageLabels(card)}
              className="h-10 w-fit rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-background"
            >
              Gerenciar etiquetas
            </button>
          </section>
        ) : null}

        {card && onAssigneesChange ? (
          <AssigneesSection
            boardId={boardId}
            cardId={card.id}
            assignees={card.assignees}
            members={members}
            onAssigneesChange={onAssigneesChange}
          />
        ) : null}

        {card ? (
          <ChecklistSection
            boardId={boardId}
            cardId={card.id}
            onProgressChange={(total, done) => onChecklistProgressChange?.(card.id, total, done)}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3.5 py-3 text-xs text-muted">
            O checklist fica disponível depois que o card for salvo.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label="Prazo"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={() => setDueDate("")}
              disabled={dueDate === ""}
              className="h-11 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpar
            </button>
          </div>

          {dueDate !== "" ? (
            <span
              className={`w-fit rounded-md px-2 py-1 text-xs ${
                describeDueDate(dueDate).startsWith("Atrasado")
                  ? "bg-red-50 text-red-700"
                  : describeDueDate(dueDate) === "Vence hoje"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-background text-muted"
              }`}
            >
              {describeDueDate(dueDate)}
            </span>
          ) : null}
        </div>

        {card && onCommentCountChange ? (
          <CommentsSection
            boardId={boardId}
            cardId={card.id}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onCountChange={onCommentCountChange}
          />
        ) : null}

        {error ? <FormMessage message={error} /> : null}

        <div className="flex flex-wrap justify-end gap-3">
          {isEditing && onRequestDelete && card ? (
            <button
              type="button"
              onClick={() => onRequestDelete(card)}
              className="mr-auto h-11 rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              Excluir card
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || title.trim().length === 0}
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            Salvar card
          </button>
        </div>
      </form>
    </Modal>
  );
}
