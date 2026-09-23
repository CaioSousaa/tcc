"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { CloseIcon, PlusIcon } from "@/components/icons";
import type { BoardMember } from "@/lib/board-members";
import type { CardAssignee } from "@/lib/card-assignees";
import { parseApiError } from "@/lib/errors";

interface AssigneesSectionProps {
  assignableMembers: BoardMember[];
  assignees: CardAssignee[];
  onAssign: (userId: string) => Promise<void>;
  onUnassign: (assigneeId: string) => Promise<void>;
}

export function AssigneesSection({
  assignableMembers,
  assignees,
  onAssign,
  onUnassign,
}: AssigneesSectionProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const assignedUserIds = new Set(assignees.map((assignee) => assignee.userId));
  const availableMembers = assignableMembers.filter(
    (member) => member.userId !== null && !assignedUserIds.has(member.userId),
  );

  async function handleAssign(userId: string) {
    setError("");
    setIsPickerOpen(false);

    try {
      await onAssign(userId);
    } catch (assignError) {
      setError(parseApiError(assignError).message);
    }
  }

  async function handleUnassign(assigneeId: string) {
    setError("");

    try {
      await onUnassign(assigneeId);
    } catch (unassignError) {
      setError(parseApiError(unassignError).message);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Responsáveis</span>

      <div className="flex flex-wrap items-center gap-2">
        {assignees.map((assignee) => {
          const member = assignableMembers.find(
            (item) => item.userId === assignee.userId,
          );

          return (
            <span
              key={assignee.id}
              className="group relative"
              title={member?.name ?? member?.email}
            >
              <Avatar
                seed={assignee.userId}
                name={member?.name ?? null}
                size="md"
              />
              <button
                type="button"
                onClick={() => handleUnassign(assignee.id)}
                aria-label={`Remover ${member?.name ?? "responsável"}`}
                className="absolute -right-1 -top-1 hidden h-4 w-4 place-items-center rounded-full bg-danger text-white group-hover:grid"
              >
                <CloseIcon />
              </button>
            </span>
          );
        })}

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPickerOpen((open) => !open)}
            aria-label="Adicionar responsável"
            title="Adicionar responsável"
            className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-line text-muted transition hover:border-navy hover:text-navy"
          >
            <PlusIcon />
          </button>

          {isPickerOpen ? (
            <ul className="absolute left-0 top-11 z-10 max-h-48 w-56 overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
              {availableMembers.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">
                  Nenhum membro disponível
                </li>
              ) : (
                availableMembers.map((member) => (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => member.userId && handleAssign(member.userId)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[15px] transition hover:bg-background"
                    >
                      <Avatar seed={member.userId ?? member.email} name={member.name} />
                      <span className="truncate">{member.name ?? member.email}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
