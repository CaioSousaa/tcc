"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { FormMessage } from "./FormMessage";
import {
  BoardMember,
  CardAssignee,
  assignMemberRequest,
  unassignMemberRequest,
} from "@/lib/membersApi";
import { getErrorMessage } from "@/lib/errors";

interface AssigneesSectionProps {
  boardId: string;
  cardId: string;
  assignees: CardAssignee[];
  members: BoardMember[];
  onAssigneesChange: (cardId: string, assignees: CardAssignee[]) => void;
}

export function AssigneesSection({
  boardId,
  cardId,
  assignees,
  members,
  onAssigneesChange,
}: AssigneesSectionProps) {
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const available = members.filter(
    (member) => !assignees.some((assignee) => assignee.memberId === member.id)
  );

  async function run(
    action: () => Promise<CardAssignee[]>,
    fallback: string
  ): Promise<void> {
    setError("");
    setIsBusy(true);

    try {
      onAssigneesChange(cardId, await action());
    } catch (actionError) {
      setError(getErrorMessage(actionError, fallback));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">Responsáveis</h3>

      <div className="flex flex-wrap items-center gap-2">
        {assignees.map((assignee) => (
          <span
            key={assignee.memberId}
            className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-2"
          >
            <Avatar name={assignee.name} email={assignee.email} size="sm" />
            <span className="text-xs text-foreground">{assignee.name ?? assignee.email}</span>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                void run(
                  () => unassignMemberRequest(boardId, cardId, assignee.memberId),
                  "Não foi possível remover o responsável."
                )
              }
              aria-label={`Remover ${assignee.name ?? assignee.email} dos responsáveis`}
              className="text-muted transition-colors hover:text-red-700"
            >
              ×
            </button>
          </span>
        ))}

        {assignees.length === 0 ? (
          <span className="text-xs text-muted">Nenhum responsável ainda.</span>
        ) : null}
      </div>

      {available.length > 0 ? (
        <select
          value=""
          disabled={isBusy}
          onChange={(event) => {
            const memberId = event.target.value;

            if (memberId !== "") {
              void run(
                () => assignMemberRequest(boardId, cardId, memberId),
                "Não foi possível adicionar o responsável."
              );
            }
          }}
          aria-label="Adicionar responsável"
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
        >
          <option value="">+ Adicionar responsável</option>
          {available.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name ?? member.email}
            </option>
          ))}
        </select>
      ) : null}

      {error ? <FormMessage message={error} /> : null}
    </section>
  );
}
