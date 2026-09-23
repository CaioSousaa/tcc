"use client";

import { useEffect, useId, useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import {
  canConfirm,
  cascadeWarning,
  deletionSummary,
  initialDecision,
  reconcileDecision,
  suggestedTarget,
  targetOptions,
  toDecision,
  type DeletionDraft,
} from "@/lib/listDeletion";
import { deleteListTitle } from "@/lib/listsState";
import { MESSAGES } from "@/lib/messages";
import { useSubmitLock } from "@/lib/useSubmitLock";
import type { BoardListItem } from "@/services/boardService";
import type { ListDeletionDecision } from "@/services/listService";
import { DeletionOption } from "./DeletionOption";

type Props = {
  /** The list as currently known by the board page; refreshed after a reload (F60). */
  list: BoardListItem;
  lists: readonly BoardListItem[];
  locked: boolean;
  onClose: () => void;
  /** Throws when the dialog must stay open with the message (F61). */
  onConfirm: (decision: ListDeletionDecision) => Promise<void>;
};

/** Decision dialog for a list with cards (RF05 spec 2.3, prototipo/modais/excluir-lista.png). */
export function DeleteListWithCardsDialog({ list, lists, locked, onClose, onConfirm }: Props) {
  const targetSelectId = useId();
  const { submitting, run } = useSubmitLock();
  const [draft, setDraft] = useState<DeletionDraft>(() => initialDecision(lists, list.id, locked));
  const [error, setError] = useState<string | null>(null);

  // After a reload the lock or the destinations may have changed (CA25, CA26).
  useEffect(() => {
    setDraft((current) => reconcileDecision(current, lists, list.id, locked));
  }, [lists, list.id, locked]);

  const options = targetOptions(lists, list.id);
  const hasTarget = options.length > 0;

  function choose(choice: "move" | "cascade") {
    setDraft((current) =>
      choice === "move"
        ? { choice, targetListId: current.targetListId ?? suggestedTarget(lists, list.id) }
        : { ...current, choice },
    );
  }

  function confirm() {
    const decision = toDecision(draft, list.cardCount);
    if (!decision || !canConfirm(draft, locked, hasTarget)) return;
    void run(async () => {
      setError(null);
      try {
        await onConfirm(decision);
      } catch (reason) {
        setError(toApiError(reason).message);
      }
    });
  }

  return (
    <Modal open title={deleteListTitle(list.name)} onClose={onClose} busy={submitting}>
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
            ⚠
          </span>
          <p className="text-[15px] leading-relaxed text-muted">{deletionSummary(list.cardCount)}</p>
        </div>

        {error ? <Alert>{error}</Alert> : null}
        {locked ? <Alert tone="info">{MESSAGES.deletionLockedNotice}</Alert> : null}

        <fieldset className="flex flex-col gap-3" disabled={submitting}>
          <legend className="sr-only">O que fazer com os cards</legend>

          <DeletionOption
            name="deletion-rule"
            value="move"
            title={MESSAGES.deletionMoveTitle}
            hint={hasTarget ? MESSAGES.deletionMoveHint : MESSAGES.deletionMoveUnavailable}
            checked={draft.choice === "move"}
            disabled={locked || !hasTarget}
            onSelect={() => choose("move")}
          >
            {hasTarget ? (
              <>
                <label htmlFor={targetSelectId} className="sr-only">
                  Lista de destino
                </label>
                <select
                  id={targetSelectId}
                  value={draft.targetListId ?? ""}
                  disabled={locked || draft.choice !== "move"}
                  onChange={(event) => setDraft({ choice: "move", targetListId: event.target.value })}
                  className="h-11 w-full max-w-xs rounded-lg border border-line bg-white px-3 text-[15px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
                >
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </DeletionOption>

          <DeletionOption
            name="deletion-rule"
            value="cascade"
            title={MESSAGES.deletionCascadeTitle}
            hint={cascadeWarning(list.cardCount)}
            checked={draft.choice === "cascade"}
            disabled={locked}
            destructive
            onSelect={() => choose("cascade")}
          />

          <DeletionOption
            name="deletion-rule"
            value="block"
            title={MESSAGES.deletionBlockTitle}
            hint={MESSAGES.deletionBlockHint}
            checked={false}
            active={locked}
            disabled
            onSelect={() => undefined}
          />
        </fieldset>

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
            disabled={submitting || !canConfirm(draft, locked, hasTarget)}
            aria-busy={submitting}
            className="h-12 rounded-lg bg-danger px-5 text-[15px] font-semibold text-white transition hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
