"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { deleteLabelBody, deleteLabelTitle } from "@/lib/labels";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { LabelView } from "@/services/labelService";

type Props = {
  label: LabelView;
  onCancel: () => void;
  /** Resolves when handled; throws to keep the confirmation open with the message (CE03). */
  onConfirm: (label: LabelView) => Promise<void>;
};

/** "Excluir a etiqueta "{nome}"?" with the usage of the label (RF08 spec 2.5). */
export function DeleteLabelDialog({ label, onCancel, onConfirm }: Props) {
  const { submitting, run } = useSubmitLock();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    void run(async () => {
      setError(null);
      try {
        await onConfirm(label);
      } catch (reason) {
        setError(toApiError(reason).message);
      }
    });
  }

  return (
    <Modal open title={deleteLabelTitle(label.name)} onClose={onCancel} busy={submitting}>
      <div className="flex flex-col gap-6">
        {error ? <Alert>{error}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">{deleteLabelBody(label.usage)}</p>
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
