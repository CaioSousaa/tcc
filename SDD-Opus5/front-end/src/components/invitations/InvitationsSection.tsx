"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { isSessionError, toApiError } from "@/lib/api";
import { boardColorHex } from "@/lib/boardColors";
import { localToday } from "@/lib/dueDate";
import { invitationFailureAction, roleLabel } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import type { BoardSummary } from "@/services/boardService";
import { invitationService, type UserInvitation } from "@/services/invitationService";

type Props = {
  /** The accepted board goes first in the grid (CA12). */
  onAccepted: (board: BoardSummary) => void;
};

type ItemError = { id: string; message: string };

/**
 * "Convites" above the grid (RF07 spec 2.1, 2.5). Loaded on its own, in parallel
 * with the boards: a failure here never blocks the grid (F92). Hidden when empty.
 */
export function InvitationsSection({ onAccepted }: Props) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [itemError, setItemError] = useState<ItemError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    invitationService
      .list()
      .then((result) => {
        if (!cancelled) setInvitations(result);
      })
      .catch((error: unknown) => {
        // Session errors are handled globally; other failures only hide the section.
        if (!cancelled && !isSessionError(toApiError(error))) setInvitations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function drop(id: string) {
    setInvitations((current) => current.filter((invitation) => invitation.id !== id));
  }

  async function answer(invitation: UserInvitation, accept: boolean) {
    if (pendingId) return;
    setPendingId(invitation.id);
    setItemError(null);
    setNotice(null);
    try {
      if (accept) {
        const board = await invitationService.accept(invitation.id, localToday(new Date()));
        drop(invitation.id);
        onAccepted(board);
      } else {
        await invitationService.decline(invitation.id);
        drop(invitation.id);
      }
    } catch (error) {
      const apiError = toApiError(error);
      if (invitationFailureAction(apiError) === "remove-with-message") {
        // Cancelled or board deleted meanwhile (CA16, CB19).
        drop(invitation.id);
        setNotice(apiError.message);
      } else {
        setItemError({ id: invitation.id, message: apiError.message });
      }
    } finally {
      setPendingId(null);
    }
  }

  if (invitations.length === 0 && !notice) return null;

  return (
    <section aria-labelledby="invitations-title" className="mt-9 flex flex-col gap-3">
      <h2 id="invitations-title" className="text-lg font-semibold text-ink">
        {MESSAGES.invitationsTitle}
      </h2>
      {notice ? <Alert>{notice}</Alert> : null}
      {invitations.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {invitations.map((invitation) => {
            const pending = pendingId === invitation.id;
            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <span
                  aria-hidden="true"
                  className="hidden h-10 w-1.5 shrink-0 rounded-full sm:block"
                  style={{ backgroundColor: boardColorHex(invitation.board.color) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[15px] font-medium text-ink [overflow-wrap:anywhere]">{invitation.board.name}</p>
                  <p className="text-sm text-muted">
                    <span className="[overflow-wrap:anywhere]">Convidado por {invitation.invitedBy.name}</span>
                    {" · "}
                    {roleLabel(invitation.role)}
                  </p>
                  {itemError?.id === invitation.id ? (
                    <p role="alert" className="mt-1 text-sm text-danger">
                      {itemError.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void answer(invitation, true)}
                    disabled={pendingId !== null}
                    aria-busy={pending}
                    aria-label={`Aceitar convite para ${invitation.board.name}`}
                    className="h-10 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-70"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => void answer(invitation, false)}
                    disabled={pendingId !== null}
                    aria-label={`Recusar convite para ${invitation.board.name}`}
                    className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-surface disabled:opacity-60"
                  >
                    Recusar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
