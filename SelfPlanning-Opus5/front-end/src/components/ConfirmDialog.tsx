"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { FormMessage } from "./FormMessage";
import { getErrorMessage } from "@/lib/errors";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  errorFallback: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  errorFallback,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleConfirm(): Promise<void> {
    setError("");
    setIsConfirming(true);

    try {
      await onConfirm();
    } catch (confirmError) {
      setError(getErrorMessage(confirmError, errorFallback));
      setIsConfirming(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"
          >
            !
          </span>
          <p className="text-sm leading-relaxed text-muted">{description}</p>
        </div>

        {error ? <FormMessage message={error} /> : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border px-5 text-sm font-medium text-foreground transition-colors hover:bg-background"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
            className="h-11 rounded-lg bg-red-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
