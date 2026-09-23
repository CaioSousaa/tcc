"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { deleteCardTitle } from "@/lib/cardsState";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";

type Props = {
  /** Saved title, not the one being edited (spec 2.5). */
  title: string;
  onCancel: () => void;
  /** Throws when the confirmation must stay open with a message (CE03). */
  onConfirm: () => Promise<void>;
};

/** Stacked on top of the card dialog; cancelling keeps the dialog and its edits (F50, CA37, N84). */
export function DeleteCardDialog({ title, onCancel, onConfirm }: Props) {
  const { submitting, run } = useSubmitLock();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    void run(async () => {
      setError(null);
      try {
        await onConfirm();
      } catch (reason) {
        setError(toApiError(reason).message);
      }
    });
  }

  return (
    <Modal open title={deleteCardTitle(title)} onClose={onCancel} busy={submitting}>
      <div className="flex flex-col gap-6">
        {error ? <Alert>{error}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">{MESSAGES.deleteCardBody}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            data-autofocus
            onClick={onCancel}
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
            {submitting ? "Excluindo..." : "Excluir card"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
