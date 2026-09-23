"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";

type Props = {
  onCancel: () => void;
  /** Resolves when handled; throws to keep the confirmation open with the message (CE03). */
  onConfirm: () => Promise<void>;
};

/** "Excluir comentário?" (RF09 spec 2.6). */
export function DeleteCommentDialog({ onCancel, onConfirm }: Props) {
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
    <Modal open title={MESSAGES.deleteCommentTitle} onClose={onCancel} busy={submitting}>
      <div className="flex flex-col gap-6">
        {error ? <Alert>{error}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">{MESSAGES.deleteCommentBody}</p>
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
            className="h-12 rounded-lg bg-danger px-5 text-[15px] font-semibold text-white transition hover:bg-danger/90 disabled:opacity-80"
          >
            {submitting ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
