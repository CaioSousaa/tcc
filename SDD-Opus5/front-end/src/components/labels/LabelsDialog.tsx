"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError, type ApiError } from "@/lib/api";
import type { LabelColor } from "@/lib/labelColors";
import { labelFailureAction, type LabelOperation } from "@/lib/labels";
import { MESSAGES } from "@/lib/messages";
import { can, type BoardRole } from "@/lib/permissions";
import { labelService, type LabelView } from "@/services/labelService";
import { DeleteLabelDialog } from "./DeleteLabelDialog";
import { LabelCheckRow } from "./LabelCheckRow";
import { LabelManageRow } from "./LabelManageRow";
import { NewLabelForm } from "./NewLabelForm";

export type LabelsDialogMode = { kind: "manage" } | { kind: "card"; cardId: string; labelIds: string[] };

type Props = {
  boardId: string;
  mode: LabelsDialogMode;
  myRole: BoardRole;
  /** Labels already known by the board page; replaced by the saved ones on open (F113). */
  initialLabels: LabelView[];
  onClose: () => void;
  /** Saved labels with usage after every action (F110). */
  onLabelsChange: (labels: LabelView[]) => void;
  /** A label was deleted: the board page removes it from the cards and from the filter (CA17, CA33). */
  onLabelDeleted: (labelId: string, labels: LabelView[]) => void;
  /** Card mode: saved labels of the card (CA20). */
  onCardLabelsChange: (labelIds: string[]) => void;
  /** FORBIDDEN: the board page closes the window, shows the message and reloads the board (CB14). */
  onForbidden: (message: string) => void;
  onBoardGone: () => void;
  /** Card mode: the card no longer exists (CB13). */
  onCardGone: (error: ApiError) => void;
};

/**
 * "Etiquetas do quadro" (RF08 spec 2.2–2.5). Management mode edits and deletes;
 * card mode applies and removes. Every action is saved immediately, without
 * optimistic update, and its response replaces the list (F113, F114).
 */
export function LabelsDialog({
  boardId,
  mode,
  myRole,
  initialLabels,
  onClose,
  onLabelsChange,
  onLabelDeleted,
  onCardLabelsChange,
  onForbidden,
  onBoardGone,
  onCardGone,
}: Props) {
  const [labels, setLabels] = useState<LabelView[]>(initialLabels);
  const [cardLabelIds, setCardLabelIds] = useState<string[]>(mode.kind === "card" ? mode.labelIds : []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<LabelView | null>(null);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const canManage = can(myRole, "labels.manage");
  const manageMode = mode.kind === "manage";

  function applyLabels(next: LabelView[]) {
    setLabels(next);
    onLabelsChange(next);
  }

  async function reload() {
    try {
      applyLabels(await labelService.list(boardId));
    } catch (error) {
      if (toApiError(error).code === "BOARD_NOT_FOUND") onBoardGone();
    }
  }

  // Usage and labels as saved, even if the board page is stale (CB15).
  useEffect(() => {
    void reload();
    // Loaded once when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  /** Returns normally when handled here; rethrows when a form or confirmation must show it. */
  async function handleFailure(operation: LabelOperation, error: unknown) {
    const apiError = toApiError(error);
    switch (labelFailureAction(operation, apiError)) {
      case "board-not-found":
        onBoardGone();
        return;
      case "forbidden":
        onForbidden(apiError.message);
        return;
      case "card-gone":
        onCardGone(apiError);
        return;
      case "done-and-reload":
        setDeleting(null);
        await reload();
        return;
      case "reload-with-message":
        setEditingId(null);
        setNotice(apiError.message);
        await reload();
        return;
      case "show-in-window":
        setNotice(apiError.message);
        return;
      default:
        throw error;
    }
  }

  async function create(name: string, color: LabelColor) {
    setNotice(null);
    try {
      applyLabels((await labelService.create(boardId, name, color)).labels);
    } catch (error) {
      await handleFailure("create", error);
    }
  }

  async function save(label: LabelView, name: string, color: LabelColor) {
    setNotice(null);
    try {
      applyLabels((await labelService.update(boardId, label.id, name, color)).labels);
      setEditingId(null);
    } catch (error) {
      await handleFailure("update", error);
    }
  }

  async function remove(label: LabelView) {
    setNotice(null);
    try {
      const next = await labelService.remove(boardId, label.id);
      setLabels(next);
      onLabelDeleted(label.id, next);
      if (editingId === label.id) setEditingId(null);
      setDeleting(null);
    } catch (error) {
      const apiError = toApiError(error);
      if (labelFailureAction("delete", apiError) === "done-and-reload") {
        // Already deleted elsewhere: success (CB12).
        setDeleting(null);
        try {
          const next = await labelService.list(boardId);
          setLabels(next);
          onLabelDeleted(label.id, next);
        } catch {
          // The row stays until the next reload.
        }
        return;
      }
      await handleFailure("delete", error);
    }
  }

  async function toggle(label: LabelView, apply: boolean) {
    if (mode.kind !== "card" || pending.has(label.id)) return;
    setNotice(null);
    setPending((current) => new Set(current).add(label.id));
    try {
      const result = apply
        ? await labelService.apply(boardId, mode.cardId, label.id)
        : await labelService.unapply(boardId, mode.cardId, label.id);
      applyLabels(result.labels);
      setCardLabelIds(result.labelIds);
      onCardLabelsChange(result.labelIds);
    } catch (error) {
      if (!apply && labelFailureAction("unapply", toApiError(error)) === "done-and-reload") {
        // The label is gone, so it is no longer on the card.
        const next = cardLabelIds.filter((id) => id !== label.id);
        setCardLabelIds(next);
        onCardLabelsChange(next);
      }
      await handleFailure(apply ? "apply" : "unapply", error);
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(label.id);
        return next;
      });
    }
  }

  const applied = new Set(cardLabelIds);
  const emptyText = !manageMode && !canManage ? MESSAGES.labelsEmptyMember : MESSAGES.labelsEmpty;

  return (
    <>
      <Modal open title={MESSAGES.labelsTitle} onClose={onClose}>
        <div className="flex flex-col gap-5">
          <p className="-mt-3 text-[15px] text-muted">{manageMode ? MESSAGES.labelsManageIntro : MESSAGES.labelsCardIntro}</p>
          {notice ? <Alert>{notice}</Alert> : null}

          {labels.length === 0 ? (
            <p className="text-[15px] text-muted">{emptyText}</p>
          ) : (
            <ul aria-label="Etiquetas" className="flex max-h-[45vh] flex-col gap-2 overflow-y-auto">
              {labels.map((label) =>
                manageMode ? (
                  <LabelManageRow
                    key={editingId === label.id ? `${label.id}-edit` : label.id}
                    label={label}
                    editing={editingId === label.id}
                    onStartEdit={(target) => setEditingId(target.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={save}
                    onDelete={setDeleting}
                  />
                ) : (
                  <LabelCheckRow
                    key={label.id}
                    label={label}
                    checked={applied.has(label.id)}
                    pending={pending.has(label.id)}
                    onChange={(target, apply) => void toggle(target, apply)}
                  />
                ),
              )}
            </ul>
          )}

          {canManage ? <NewLabelForm onCreate={create} /> : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark"
            >
              Concluído
            </button>
          </div>
        </div>
      </Modal>

      {deleting ? <DeleteLabelDialog label={deleting} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
    </>
  );
}
