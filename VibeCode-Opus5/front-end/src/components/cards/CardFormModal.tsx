"use client";

import { useState, type FormEvent } from "react";
import { AssigneesSection } from "@/components/cards/AssigneesSection";
import { ChecklistSection } from "@/components/checklists/ChecklistSection";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { CloseIcon } from "@/components/icons";
import { LabelChip } from "@/components/labels/LabelChip";
import { LabelsModal } from "@/components/labels/LabelsModal";
import { Modal } from "@/components/Modal";
import { TextField } from "@/components/TextField";
import type { BoardMember } from "@/lib/board-members";
import type { CardAssignee } from "@/lib/card-assignees";
import type { CardLabel } from "@/lib/card-labels";
import type { BoardCard } from "@/lib/cards";
import type { ChecklistItem } from "@/lib/checklist-items";
import type { Comment } from "@/lib/comments";
import { parseApiError } from "@/lib/errors";
import type { Label, LabelInput } from "@/lib/labels";

interface CardFormModalProps {
  card?: BoardCard | undefined;
  checklistItems?: ChecklistItem[] | undefined;
  onAddChecklistItem?: ((title: string) => Promise<void>) | undefined;
  onToggleChecklistItem?:
    | ((item: ChecklistItem, done: boolean) => Promise<void>)
    | undefined;
  onDeleteChecklistItem?: ((item: ChecklistItem) => Promise<void>) | undefined;
  assignableMembers?: BoardMember[] | undefined;
  assignees?: CardAssignee[] | undefined;
  onAssign?: ((userId: string) => Promise<void>) | undefined;
  onUnassign?: ((assigneeId: string) => Promise<void>) | undefined;
  labels?: Label[] | undefined;
  cardLabels?: CardLabel[] | undefined;
  labelUsageCounts?: Record<string, number> | undefined;
  isAdmin?: boolean | undefined;
  onCreateLabel?: ((input: LabelInput) => Promise<void>) | undefined;
  onDeleteLabel?: ((labelId: string) => Promise<void>) | undefined;
  onAssignLabel?: ((labelId: string) => Promise<void>) | undefined;
  onUnassignLabel?: ((cardLabelId: string) => Promise<void>) | undefined;
  comments?: Comment[] | undefined;
  currentUserId?: string | undefined;
  currentUserName?: string | undefined;
  onAddComment?: ((body: string) => Promise<void>) | undefined;
  onDeleteComment?: ((comment: Comment) => Promise<void>) | undefined;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string | null;
    dueDate: string | null;
  }) => Promise<void>;
}

export function CardFormModal({
  card,
  checklistItems,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  assignableMembers,
  assignees,
  onAssign,
  onUnassign,
  labels,
  cardLabels,
  labelUsageCounts,
  isAdmin,
  onCreateLabel,
  onDeleteLabel,
  onAssignLabel,
  onUnassignLabel,
  comments,
  currentUserId,
  currentUserName,
  onAddComment,
  onDeleteComment,
  onClose,
  onSubmit,
}: CardFormModalProps) {
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);
  const isEditing = Boolean(card);

  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState(card?.dueDate ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description.trim() ? description : null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      setFieldErrors(parsed.fields);
      setFormError(parsed.message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
    <Modal
      onClose={onClose}
      width={isEditing ? "max-w-[540px]" : undefined}
      title={
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">
            {isEditing ? "Editar card" : "Novo card"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          label="Título"
          name="title"
          placeholder="Ex.: Revisar layout do card"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={fieldErrors["title"]}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm text-foreground">
            Descrição
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Detalhes do card (opcional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`w-full resize-none rounded-lg border bg-surface px-4 py-3 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15 ${
              fieldErrors["description"] ? "border-danger" : "border-line"
            }`}
          />
          {fieldErrors["description"] ? (
            <p className="text-xs text-danger">{fieldErrors["description"]}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dueDate" className="text-sm text-foreground">
            Prazo
          </label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={dueDate ?? ""}
            onChange={(event) => setDueDate(event.target.value)}
            className={`w-full rounded-lg border bg-surface px-4 py-3 text-[15px] text-foreground outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/15 ${
              fieldErrors["dueDate"] ? "border-danger" : "border-line"
            }`}
          />
          {fieldErrors["dueDate"] ? (
            <p className="text-xs text-danger">{fieldErrors["dueDate"]}</p>
          ) : null}
        </div>

        {isEditing && labels && cardLabels && onAssignLabel && onUnassignLabel ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">
              Etiquetas
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {cardLabels.map((cardLabel) => {
                const label = labels.find((item) => item.id === cardLabel.labelId);

                return label ? (
                  <LabelChip key={cardLabel.id} name={label.name} color={label.color} />
                ) : null;
              })}

              <button
                type="button"
                onClick={() => setIsLabelsModalOpen(true)}
                className="rounded-md border border-dashed border-line px-2.5 py-1 text-xs text-muted transition hover:border-navy hover:text-foreground"
              >
                Gerenciar etiquetas
              </button>
            </div>
          </div>
        ) : null}

        {isEditing && assignableMembers && assignees && onAssign && onUnassign ? (
          <AssigneesSection
            assignableMembers={assignableMembers}
            assignees={assignees}
            onAssign={onAssign}
            onUnassign={onUnassign}
          />
        ) : null}

        {isEditing &&
        checklistItems &&
        onAddChecklistItem &&
        onToggleChecklistItem &&
        onDeleteChecklistItem ? (
          <ChecklistSection
            items={checklistItems}
            onAdd={onAddChecklistItem}
            onToggle={onToggleChecklistItem}
            onDelete={onDeleteChecklistItem}
          />
        ) : null}

        {isEditing && comments && onAddComment && onDeleteComment ? (
          <CommentsSection
            comments={comments}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onAdd={onAddComment}
            onDelete={onDeleteComment}
          />
        ) : null}

        {formError ? (
          <p role="alert" className="text-sm text-danger">
            {formError}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2.5 text-[15px] font-medium text-foreground transition hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar card
          </button>
        </div>
      </form>
    </Modal>

    {isLabelsModalOpen && labels && onCreateLabel && onDeleteLabel ? (
      <LabelsModal
        labels={labels}
        isAdmin={isAdmin ?? false}
        usageCounts={labelUsageCounts ?? {}}
        assignedLabelIds={(cardLabels ?? []).map((cardLabel) => cardLabel.labelId)}
        onToggleAssign={async (label, assign) => {
          const existing = cardLabels?.find(
            (cardLabel) => cardLabel.labelId === label.id,
          );

          if (assign) {
            await onAssignLabel?.(label.id);
          } else if (existing) {
            await onUnassignLabel?.(existing.id);
          }
        }}
        onCreate={onCreateLabel}
        onDelete={onDeleteLabel}
        onClose={() => setIsLabelsModalOpen(false)}
      />
    ) : null}
    </>
  );
}
