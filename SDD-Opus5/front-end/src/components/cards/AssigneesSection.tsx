"use client";

import { useId, useState } from "react";
import { PlusIcon } from "@/components/boards/icons";
import { Avatar } from "@/components/members/Avatar";
import { toApiError, type ApiError } from "@/lib/api";
import { assigneeFailureAction } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import { assigneeService, type AssigneeRef } from "@/services/assigneeService";
import type { BoardMember } from "@/services/boardService";
import { cardService } from "@/services/cardService";

type Props = {
  boardId: string;
  cardId: string;
  initialAssignees: AssigneeRef[];
  /** Active participants of the board, in order of entry; invitations never appear (CA32). */
  members: readonly BoardMember[];
  /** Board page updates the card face (F93). */
  onChange: (assigneeIds: string[]) => void;
  /** Board or card is gone; the board page handles it. */
  onCardGone: (error: ApiError) => void;
  /** Participants changed elsewhere: the board page reloads people (CB15). */
  onMembersStale: () => void;
};

/**
 * "Responsáveis" in the card dialog (RF07 spec 2.9). Saved immediately, without
 * optimistic update and independent of "Salvar card", like the checklist (F93, C170).
 */
export function AssigneesSection({ boardId, cardId, initialAssignees, members, onChange, onCardGone, onMembersStale }: Props) {
  const titleId = useId();
  const pickerId = useId();
  const [assignees, setAssignees] = useState<AssigneeRef[]>(initialAssignees);
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const assigned = new Set(assignees.map((assignee) => assignee.userId));

  function apply(next: AssigneeRef[]) {
    setAssignees(next);
    onChange(next.map((assignee) => assignee.userId));
  }

  async function reload() {
    try {
      apply((await cardService.get(boardId, cardId)).assignees);
    } catch (error) {
      const apiError = toApiError(error);
      if (assigneeFailureAction(apiError) === "card-gone") onCardGone(apiError);
    }
  }

  async function change(userId: string, assign: boolean) {
    if (pending.has(userId)) return;
    setNotice(null);
    setPending((current) => new Set(current).add(userId));
    try {
      apply(
        assign
          ? await assigneeService.assign(boardId, cardId, userId)
          : await assigneeService.unassign(boardId, cardId, userId),
      );
    } catch (error) {
      const apiError = toApiError(error);
      switch (assigneeFailureAction(apiError)) {
        case "card-gone":
          onCardGone(apiError);
          break;
        case "reload":
          setNotice(apiError.message);
          onMembersStale();
          await reload();
          break;
        default:
          // The selection stays as saved (CE04).
          setNotice(apiError.message);
      }
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(userId);
        return next;
      });
    }
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h3 id={titleId} className="text-sm font-medium text-ink">
        {MESSAGES.assigneesTitle}
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        {assignees.length === 0 ? <span className="text-sm text-muted">{MESSAGES.assigneesEmpty}</span> : null}
        <ul className="flex flex-wrap items-center gap-1.5">
          {assignees.map((assignee) => (
            <li key={assignee.userId}>
              <button
                type="button"
                onClick={() => void change(assignee.userId, false)}
                disabled={pending.has(assignee.userId)}
                aria-label={`Remover ${assignee.name} dos responsáveis`}
                title={`Remover ${assignee.name}`}
                className="rounded-full transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
              >
                <Avatar name={assignee.name} colorKey={assignee.userId} size="md" decorative />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setPicking((open) => !open)}
          aria-expanded={picking}
          aria-controls={pickerId}
          aria-label="Escolher responsáveis"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-muted/60 bg-white text-muted transition hover:border-brand hover:text-brand"
        >
          <PlusIcon />
        </button>
      </div>

      {picking ? (
        <fieldset id={pickerId} className="flex flex-col gap-1 rounded-lg border border-line bg-white p-2">
          <legend className="sr-only">Participantes do quadro</legend>
          {members.map((member) => {
            const inputId = `${pickerId}-${member.userId}`;
            return (
              <div key={member.userId} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface/70">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={assigned.has(member.userId)}
                  disabled={pending.has(member.userId)}
                  onChange={(event) => void change(member.userId, event.target.checked)}
                  className="h-4 w-4 shrink-0 accent-brand"
                />
                <Avatar name={member.name} colorKey={member.userId} size="xs" decorative />
                <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer truncate text-sm text-ink">
                  {member.name}
                </label>
              </div>
            );
          })}
        </fieldset>
      ) : null}

      {notice ? (
        <p role="alert" className="text-sm text-danger">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
