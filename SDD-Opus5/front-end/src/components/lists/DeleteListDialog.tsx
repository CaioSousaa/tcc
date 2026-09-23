"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { deleteListTitle } from "@/lib/listsState";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { BoardListItem } from "@/services/boardService";

type Props = {
  list: BoardListItem;
  onClose: () => void;
  /** Performs the deletion; throws when the dialog must show an error (CE02, RN11). */
  onConfirm: (list: BoardListItem) => Promise<void>;
};

/** Confirmation for an empty list (spec 2.4, N62). */
export function DeleteListDialog({ list, onClose, onConfirm }: Props) {
  const { submitting, run } = useSubmitLock();
  const [formError, setFormError] = useState<string | null>(null);

  function confirm() {
    void run(async () => {
      setFormError(null);
      try {
        await onConfirm(list);
      } catch (error) {
        setFormError(toApiError(error).message);
      }
    });
  }

  return (
    <Modal open title={deleteListTitle(list.name)} onClose={onClose} busy={submitting}>
      <div className="flex flex-col gap-6">
        {formError ? <Alert>{formError}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">{MESSAGES.deleteListBody}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            disabled={submitting}
            className="h-12 rounded-lg border border-line bg-white px-5 text-[15px] font-medium text-ink transition hover:bg-surface disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={submitting}
            aria-busy={submitting}
            className="flex h-12 items-center gap-2 rounded-lg bg-danger px-5 text-[15px] font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {submitting ? (
              <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {submitting ? "Excluindo..." : "Excluir lista"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
