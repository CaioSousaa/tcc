"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { useSubmitLock } from "@/lib/useSubmitLock";

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  busyLabel: string;
  onCancel: () => void;
  /** Resolves when handled; throws to keep the confirmation open with the message (CE03). */
  onConfirm: () => Promise<void>;
};

/** Confirmation of "Remover" and "Sair do quadro" (RF07 spec 2.7). */
export function ConfirmRemoveDialog({ title, body, confirmLabel, busyLabel, onCancel, onConfirm }: Props) {
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
    <Modal open title={title} onClose={onCancel} busy={submitting}>
      <div className="flex flex-col gap-6">
        {error ? <Alert>{error}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">{body}</p>
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
            {submitting ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
