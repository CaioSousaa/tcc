"use client";

import { useState } from "react";
import { AlertIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import type { BoardCard } from "@/lib/cards";
import { parseApiError } from "@/lib/errors";

interface DeleteCardModalProps {
  card: BoardCard;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteCardModal({
  card,
  onClose,
  onConfirm,
}: DeleteCardModalProps) {
  const [formError, setFormError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setFormError("");
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setFormError(parseApiError(error).message);
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      width="max-w-[500px]"
      title={
        <div className="mb-5 flex gap-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-danger/10 text-danger">
            <AlertIcon />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Excluir o card “{card.title}”?
            </h2>
            <p className="mt-1 text-[15px] text-muted">Ação irreversível.</p>
          </div>
        </div>
      }
    >
      {formError ? (
        <p role="alert" className="mb-4 text-sm text-danger">
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
          type="button"
          onClick={handleConfirm}
          disabled={isDeleting}
          className="rounded-lg bg-danger px-5 py-2.5 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Excluindo..." : "Confirmar"}
        </button>
      </div>
    </Modal>
  );
}
