"use client";

import { useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { deleteOutcome } from "@/lib/boardsState";
import { deleteBoardMessage } from "@/lib/plural";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { BoardSummary } from "@/services/boardService";

type Props = {
  board: BoardSummary;
  onClose: () => void;
  /** Performs the deletion; may throw. */
  onConfirm: (board: BoardSummary) => Promise<void>;
  /** Called when the board is gone, including when it was already deleted (RN14). */
  onDeleted: (board: BoardSummary) => void;
};

export function DeleteBoardDialog({ board, onClose, onConfirm, onDeleted }: Props) {
  const { submitting, run } = useSubmitLock();
  const [formError, setFormError] = useState<string | null>(null);

  function confirm() {
    void run(async () => {
      setFormError(null);
      let error = null;
      try {
        await onConfirm(board);
      } catch (reason) {
        error = toApiError(reason);
      }

      if (deleteOutcome(error) === "deleted") onDeleted(board);
      else setFormError(error?.message ?? null);
    });
  }

  return (
    <Modal open title="Excluir quadro" onClose={onClose} busy={submitting}>
      <div className="flex flex-col gap-6">
        {formError ? <Alert>{formError}</Alert> : null}
        <p className="text-[15px] leading-relaxed text-ink">
          {deleteBoardMessage(board.name, board.listCount, board.cardCount)}
        </p>
        <div className="flex justify-end gap-3">
          {/* Initial focus on the safe action (N41). */}
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
            {submitting ? "Excluindo..." : "Excluir quadro"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
