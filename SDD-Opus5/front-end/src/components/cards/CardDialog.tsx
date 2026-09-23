"use client";

import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { ChecklistSection } from "@/components/checklist/ChecklistSection";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { LabelsDialog } from "@/components/labels/LabelsDialog";
import { TextField } from "@/components/TextField";
import { toApiError, type ApiError } from "@/lib/api";
import { cardPositionOptions, suggestedPosition } from "@/lib/cardLocation";
import { cardDialogEyebrow } from "@/lib/cardsState";
import type { ChecklistSummary } from "@/lib/checklist";
import { CARD_DESCRIPTION_MAX, CARD_TITLE_MAX } from "@/lib/cardText";
import { MESSAGES } from "@/lib/messages";
import type { BoardRole } from "@/lib/permissions";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { FieldErrors } from "@/schemas/auth";
import { validateCardForm, type CardFormField, type CardPayload } from "@/schemas/card";
import type { BoardListItem, BoardMember } from "@/services/boardService";
import { cardService, type CardDetail } from "@/services/cardService";
import type { LabelView } from "@/services/labelService";
import { AssigneesSection } from "./AssigneesSection";
import { CardLabelsSection } from "./CardLabelsSection";
import { CardLocationFields } from "./CardLocationFields";
import { DueDateField } from "./DueDateField";
import { DeleteCardDialog } from "./DeleteCardDialog";

type Props = {
  boardId: string;
  cardId: string;
  /** Current lists of the board; they may be refreshed while the dialog is open (CB17). */
  lists: readonly BoardListItem[];
  onClose: () => void;
  /** Called when loading fails; returns true when the board page handled it (e.g. closed the dialog). */
  onLoadFailure: (error: ApiError) => boolean;
  /** Throws when the dialog must stay open with the message (CE02, CB17). */
  onSave: (payload: CardPayload) => Promise<void>;
  /** Throws when the confirmation must stay open with the message (CE03). */
  onDelete: () => Promise<void>;
  /** A checklist action was saved; the board page updates the card face (RF06 C133). */
  onChecklistChange: (summary: ChecklistSummary) => void;
  /** Participants of the board, for "Responsáveis" (RF07 spec 2.9). */
  members: readonly BoardMember[];
  /** An assignee change was saved; the board page updates the card face (RF07 F93). */
  onAssigneesChange: (assigneeIds: string[]) => void;
  /** Participants changed elsewhere; the board page reloads the board (RF07 CB15). */
  onMembersStale: () => void;
  /** Role in the board and labels of the board (RF08 spec 2.3, 2.6). */
  myRole: BoardRole;
  labels: LabelView[];
  onLabelsChange: (labels: LabelView[]) => void;
  onLabelDeleted: (labelId: string, labels: LabelView[]) => void;
  /** Labels of this card were saved; the board page updates the face (RF08 F110). */
  onCardLabelsChange: (labelIds: string[]) => void;
  /** FORBIDDEN in the labels window: the board page shows the message and reloads (RF08 F112). */
  onForbidden: (message: string) => void;
  /** Signed-in account, for comment authorship and the composer avatar (RF09 F126). */
  currentUser: { id: string; name: string } | null;
  /** Saved comment count; the board page updates the face (RF09 F128). */
  onCommentCountChange: (count: number) => void;
  /** FORBIDDEN on a comment: the board page reloads the role (RF09 CB14). */
  onRoleStale: () => void;
};

type Status = "loading" | "error" | "ready";

/**
 * Card dialog (spec 2.3–2.5). Loads the card on open, so title, description,
 * list and position come from the saved card (F44, C86). Closing discards edits (CA24).
 */
export function CardDialog({
  boardId,
  cardId,
  lists,
  onClose,
  onLoadFailure,
  onSave,
  onDelete,
  onChecklistChange,
  members,
  onAssigneesChange,
  onMembersStale,
  myRole,
  labels,
  onLabelsChange,
  onLabelDeleted,
  onCardLabelsChange,
  onForbidden,
  currentUser,
  onCommentCountChange,
  onRoleStale,
}: Props) {
  const formId = useId();
  const descriptionId = useId();
  const { submitting, run } = useSubmitLock();
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [card, setCard] = useState<CardDetail | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState("");
  const [position, setPosition] = useState(1);
  // Due date is part of the card form, saved only by "Salvar card" (RF10 F148).
  const [dueDate, setDueDate] = useState("");
  const [dueDateBadInput, setDueDateBadInput] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<CardFormField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [managingLabels, setManagingLabels] = useState(false);

  useEffect(() => {
    let cancelled = false;
    cardService
      .get(boardId, cardId)
      .then((loaded) => {
        if (cancelled) return;
        setCard(loaded);
        setTitle(loaded.title);
        setDescription(loaded.description ?? "");
        setListId(loaded.listId);
        setPosition(loaded.position);
        setDueDate(loaded.dueDate ?? "");
        setLabelIds(loaded.labelIds);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (!onLoadFailure(toApiError(error))) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // onLoadFailure is intentionally not a dependency: loading happens once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, cardId, attempt]);

  const countIn = useCallback((id: string) => lists.find((list) => list.id === id)?.cardCount ?? 0, [lists]);

  // A selected list that disappeared after a reload falls back to the card's own list (F49).
  useEffect(() => {
    if (!card || !listId) return;
    if (!lists.some((list) => list.id === listId)) {
      setListId(card.listId);
      setPosition(card.position);
    }
  }, [lists, listId, card]);

  function changeList(nextListId: string) {
    if (!card) return;
    setListId(nextListId);
    setPosition(suggestedPosition(nextListId, card, countIn(nextListId)));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      setFormError(null);
      const result = validateCardForm({ title, description, listId, position, dueDate, dueDateBadInput });
      if (!result.success) {
        // Nothing is sent: content, list and position stay as saved (CA22).
        setFieldErrors(result.fields);
        return;
      }
      setFieldErrors({});
      try {
        await onSave(result.data);
      } catch (error) {
        const apiError = toApiError(error);
        if (apiError.code === "VALIDATION_ERROR" && Object.keys(apiError.fields).length > 0) {
          setFieldErrors(apiError.fields);
        } else {
          setFormError(apiError.message);
        }
      }
    });
  }

  const savedList = card ? lists.find((list) => list.id === card.listId) : undefined;
  const sameList = card !== null && listId === card.listId;
  const options = cardPositionOptions(countIn(listId), sameList);

  return (
    <>
      <Modal
        open
        size="lg"
        title={card?.title ?? "Card"}
        eyebrow={savedList ? cardDialogEyebrow(savedList.name) : "CARD"}
        onClose={onClose}
        busy={submitting}
      >
        {status === "loading" ? (
          <div role="status" className="flex justify-center py-16">
            <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
            <span className="sr-only">Carregando card</span>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-[15px] text-ink">{MESSAGES.unexpected}</p>
            <button
              type="button"
              onClick={() => {
                setStatus("loading");
                setAttempt((value) => value + 1);
              }}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        {status === "ready" && card ? (
          // The checklist has its own forms, so the card form only wraps title and description (no nested forms).
          <div className="grid gap-6 md:grid-cols-[1fr_240px]">
            <div className="flex min-w-0 flex-col gap-6">
            <form id={formId} noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
              {formError ? <Alert>{formError}</Alert> : null}

              <TextField
                label="Título"
                name="title"
                autoComplete="off"
                data-autofocus
                maxLength={CARD_TITLE_MAX * 8}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={fieldErrors.title}
                disabled={submitting}
              />

              <div className="flex flex-col gap-2">
                <label htmlFor={descriptionId} className="text-sm font-medium text-ink">
                  Descrição
                </label>
                <textarea
                  id={descriptionId}
                  name="description"
                  rows={8}
                  // Long pasted text is kept so the limit message can be shown.
                  maxLength={CARD_DESCRIPTION_MAX * 8}
                  placeholder={MESSAGES.descriptionPlaceholder}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={submitting}
                  aria-invalid={fieldErrors.description ? true : undefined}
                  aria-describedby={fieldErrors.description ? `${descriptionId}-error` : undefined}
                  className={`min-h-[160px] resize-y whitespace-pre-wrap rounded-lg border bg-white px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 ${
                    fieldErrors.description ? "border-danger" : "border-line"
                  }`}
                />
                {fieldErrors.description ? (
                  <p id={`${descriptionId}-error`} role="alert" className="text-sm text-danger">
                    {fieldErrors.description}
                  </p>
                ) : null}
              </div>
            </form>

            <ChecklistSection
              boardId={boardId}
              cardId={card.id}
              initialItems={card.checklist}
              onChange={onChecklistChange}
              onCardGone={(error) => {
                onLoadFailure(error);
              }}
            />

            {/* Outside the card form: saved immediately, never by "Salvar card" (RF09 F134, CA12). */}
            <CommentsSection
              boardId={boardId}
              cardId={card.id}
              initialComments={card.comments}
              currentUser={currentUser}
              myRole={myRole}
              onCountChange={onCommentCountChange}
              onCardGone={(error) => {
                onLoadFailure(error);
              }}
              onForbidden={onRoleStale}
            />
            </div>

            <aside className="flex flex-col gap-6 rounded-xl bg-surface/70 p-4 md:justify-between">
              <div className="flex flex-col gap-6">
                <CardLocationFields
                  lists={lists}
                  listId={listId}
                  position={position}
                  positionOptions={options}
                  onListChange={changeList}
                  onPositionChange={setPosition}
                  disabled={submitting}
                  positionError={fieldErrors.position}
                />
                {/* Outside the card form: saved immediately, never by "Salvar card" (RF08 C205, CA23). */}
                <CardLabelsSection labelIds={labelIds} labels={labels} onManage={() => setManagingLabels(true)} />
                {/* Outside the card form: saved immediately, never by "Salvar card" (RF07 C170, CA37). */}
                <AssigneesSection
                  boardId={boardId}
                  cardId={card.id}
                  initialAssignees={card.assignees}
                  members={members}
                  onChange={onAssigneesChange}
                  onCardGone={(error) => {
                    onLoadFailure(error);
                  }}
                  onMembersStale={onMembersStale}
                />
                <DueDateField
                  value={dueDate}
                  onChange={(value, badInput) => {
                    setDueDate(value);
                    setDueDateBadInput(badInput);
                  }}
                  disabled={submitting}
                  error={fieldErrors.dueDate}
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  form={formId}
                  disabled={submitting}
                  aria-busy={submitting}
                  className="h-11 rounded-lg bg-brand text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-80"
                >
                  {submitting ? "Salvando..." : "Salvar card"}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmingDelete(true)}
                  className="h-11 rounded-lg border border-danger/40 bg-white text-[15px] font-medium text-danger transition hover:bg-danger/5 disabled:opacity-60"
                >
                  Excluir card
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </Modal>

      {managingLabels && card ? (
        <LabelsDialog
          boardId={boardId}
          mode={{ kind: "card", cardId: card.id, labelIds }}
          myRole={myRole}
          initialLabels={labels}
          onClose={() => setManagingLabels(false)}
          onLabelsChange={onLabelsChange}
          onLabelDeleted={(labelId, next) => {
            setLabelIds((current) => current.filter((id) => id !== labelId));
            onLabelDeleted(labelId, next);
          }}
          onCardLabelsChange={(next) => {
            setLabelIds(next);
            onCardLabelsChange(next);
          }}
          onForbidden={(message) => {
            setManagingLabels(false);
            onForbidden(message);
          }}
          onBoardGone={() => {
            setManagingLabels(false);
            onLoadFailure({ code: "BOARD_NOT_FOUND", message: MESSAGES.boardNotFound, fields: {} });
          }}
          onCardGone={(error) => {
            setManagingLabels(false);
            onLoadFailure(error);
          }}
        />
      ) : null}

      {confirmingDelete && card ? (
        <DeleteCardDialog title={card.title} onCancel={() => setConfirmingDelete(false)} onConfirm={onDelete} />
      ) : null}
    </>
  );
}
