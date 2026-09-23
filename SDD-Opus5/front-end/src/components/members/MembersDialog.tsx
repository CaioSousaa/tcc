"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { Modal } from "@/components/Modal";
import { toApiError } from "@/lib/api";
import { leaveBoardTitle, memberFailureAction, removeMemberTitle, type MemberOperation } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import { can, type BoardRole } from "@/lib/permissions";
import { memberService, type InvitationView, type MembersState, type MemberView } from "@/services/memberService";
import { ConfirmRemoveDialog } from "./ConfirmRemoveDialog";
import { InvitationRow } from "./InvitationRow";
import { InviteForm } from "./InviteForm";
import { MemberRow } from "./MemberRow";

type Props = {
  boardId: string;
  boardName: string;
  currentUserId: string | undefined;
  onClose: () => void;
  /** Saved state after every action, so the board updates role and avatars (C168). */
  onStateChange: (state: MembersState) => void;
  /** FORBIDDEN: the board page reloads the board and hides controls (F90). */
  onForbidden: () => void;
  /** The account no longer participates (CB13). */
  onBoardGone: () => void;
  /** Left the board: go to "Meus quadros" (CA24). */
  onLeft: () => void;
};

type Status = "loading" | "error" | "ready";
type Confirmation = { kind: "remove"; member: MemberView } | { kind: "leave" } | null;

/**
 * "Membros do quadro" (RF07 spec 2.3–2.7). Loaded on open; every action is saved
 * immediately and its response replaces the whole list (F91, CB18). No optimistic
 * update: a selector shows the saved role until the API answers (CE02).
 */
export function MembersDialog({ boardId, boardName, currentUserId, onClose, onStateChange, onForbidden, onBoardGone, onLeft }: Props) {
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<MembersState | null>(null);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);

  const apply = useCallback(
    (next: MembersState) => {
      setState(next);
      onStateChange(next);
    },
    [onStateChange],
  );

  useEffect(() => {
    let cancelled = false;
    memberService
      .get(boardId)
      .then((loaded) => {
        if (cancelled) return;
        apply(loaded);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (memberFailureAction("load", toApiError(error)) === "board-not-found") onBoardGone();
        else setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // Loaded once per attempt; callbacks from the page are not dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, attempt]);

  async function reload() {
    try {
      apply(await memberService.get(boardId));
    } catch (error) {
      if (memberFailureAction("load", toApiError(error)) === "board-not-found") onBoardGone();
    }
  }

  /** Returns normally when handled here; rethrows when a field or confirmation must show it. */
  async function handleFailure(operation: MemberOperation, error: unknown) {
    const apiError = toApiError(error);
    switch (memberFailureAction(operation, apiError)) {
      case "board-not-found":
        onBoardGone();
        return;
      case "forbidden":
        setConfirmation(null);
        setNotice(apiError.message);
        onForbidden();
        await reload();
        return;
      case "show-in-field":
        throw error;
      case "done-and-reload":
        setConfirmation(null);
        await reload();
        return;
      case "reload-with-message":
        setNotice(apiError.message);
        await reload();
        return;
      default:
        if (operation === "remove" || operation === "leave") throw error;
        setNotice(apiError.message);
    }
  }

  async function withPending(key: string, work: () => Promise<void>) {
    if (pending.has(key)) return;
    setNotice(null);
    setPending((current) => new Set(current).add(key));
    try {
      await work();
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  async function invite(email: string, role: BoardRole) {
    setNotice(null);
    try {
      apply(await memberService.invite(boardId, email, role));
    } catch (error) {
      const action = memberFailureAction("invite", toApiError(error));
      // Field errors and generic failures stay next to the e-mail, with the values kept (A58, CE01).
      if (action === "show-in-field" || action === "show-in-window") throw error;
      await handleFailure("invite", error);
    }
  }

  function changeMemberRole(member: MemberView, role: BoardRole) {
    if (role === member.role) return;
    void withPending(member.userId, async () => {
      try {
        apply(await memberService.updateMember(boardId, member.userId, role));
      } catch (error) {
        await handleFailure("member-role", error);
      }
    });
  }

  function changeInvitationRole(invitation: InvitationView, role: BoardRole) {
    if (role === invitation.role) return;
    void withPending(invitation.id, async () => {
      try {
        apply(await memberService.updateInvitation(boardId, invitation.id, role));
      } catch (error) {
        await handleFailure("invitation-role", error);
      }
    });
  }

  /** No confirmation for cancelling (spec 2.5). */
  function cancelInvitation(invitation: InvitationView) {
    void withPending(invitation.id, async () => {
      try {
        apply(await memberService.cancelInvitation(boardId, invitation.id));
      } catch (error) {
        await handleFailure("cancel", error);
      }
    });
  }

  async function confirmRemoval(member: MemberView) {
    try {
      const result = await memberService.removeMember(boardId, member.userId);
      if ("members" in result) apply(result);
      setConfirmation(null);
    } catch (error) {
      await handleFailure("remove", error);
    }
  }

  async function confirmLeave() {
    if (!currentUserId) return;
    try {
      await memberService.removeMember(boardId, currentUserId);
      setConfirmation(null);
      onLeft();
    } catch (error) {
      await handleFailure("leave", error);
    }
  }

  const canManage = state ? can(state.myRole, "members.manage") : false;

  return (
    <>
      <Modal open size="lg" title={MESSAGES.membersTitle} onClose={onClose}>
        <div className="flex flex-col gap-5">
          <p className="-mt-3 text-[15px] text-muted">{MESSAGES.membersIntro}</p>

          {status === "loading" ? (
            <div role="status" className="flex justify-center py-10">
              <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
              <span className="sr-only">Carregando membros</span>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <p className="text-[15px] text-ink">{MESSAGES.unexpected}</p>
              <button
                type="button"
                onClick={() => {
                  setStatus("loading");
                  setAttempt((value) => value + 1);
                }}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {status === "ready" && state ? (
            <>
              {canManage ? <InviteForm onInvite={invite} /> : null}
              {notice ? <Alert>{notice}</Alert> : null}
              <ul aria-label="Pessoas do quadro" className="flex flex-col">
                {state.members.map((member) => (
                  <MemberRow
                    key={member.userId}
                    member={member}
                    currentUserId={currentUserId}
                    canManage={canManage}
                    pending={pending.has(member.userId)}
                    onRoleChange={changeMemberRole}
                    onRemove={(target) => setConfirmation({ kind: "remove", member: target })}
                    onLeave={() => setConfirmation({ kind: "leave" })}
                  />
                ))}
                {state.invitations.map((invitation) => (
                  <InvitationRow
                    key={invitation.id}
                    invitation={invitation}
                    canManage={canManage}
                    pending={pending.has(invitation.id)}
                    onRoleChange={changeInvitationRole}
                    onCancel={cancelInvitation}
                  />
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </Modal>

      {confirmation?.kind === "remove" ? (
        <ConfirmRemoveDialog
          title={removeMemberTitle(confirmation.member.name)}
          body={MESSAGES.removeMemberBody}
          confirmLabel="Remover"
          busyLabel="Removendo..."
          onCancel={() => setConfirmation(null)}
          onConfirm={() => confirmRemoval(confirmation.member)}
        />
      ) : null}

      {confirmation?.kind === "leave" ? (
        <ConfirmRemoveDialog
          title={leaveBoardTitle(boardName)}
          body={MESSAGES.leaveBoardBody}
          confirmLabel="Sair"
          busyLabel="Saindo..."
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmLeave}
        />
      ) : null}
    </>
  );
}
