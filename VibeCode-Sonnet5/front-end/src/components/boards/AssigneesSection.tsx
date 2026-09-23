"use client";

import { useEffect, useState } from "react";
import { BoardMember, fetchMembers } from "@/lib/board-members";
import {
  CardAssignee,
  assignCard,
  fetchAssignees,
  unassignCard,
} from "@/lib/card-assignees";

interface AssigneesSectionProps {
  boardId: string;
  cardId: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AssigneesSection({ boardId, cardId }: AssigneesSectionProps) {
  const [assignees, setAssignees] = useState<CardAssignee[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchAssignees(boardId, cardId), fetchMembers(boardId)])
      .then(([assigneesResult, membersResult]) => {
        if (!active) return;
        setAssignees(assigneesResult);
        setMembers(membersResult);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os responsáveis.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  const availableMembers = members.filter(
    (member) => !assignees.some((assignee) => assignee.userId === member.userId),
  );

  async function handleAssign(userId: string) {
    setPicking(false);
    const member = members.find((item) => item.userId === userId);
    if (!member) return;

    setAssignees((prev) => [
      ...prev,
      { userId: member.userId, name: member.name, email: member.email },
    ]);
    try {
      await assignCard(boardId, cardId, userId);
    } catch {
      setError("Não foi possível atribuir este membro.");
      setAssignees((prev) => prev.filter((item) => item.userId !== userId));
    }
  }

  async function handleUnassign(userId: string) {
    const previous = assignees;
    setAssignees((prev) => prev.filter((item) => item.userId !== userId));
    try {
      await unassignCard(boardId, cardId, userId);
    } catch {
      setError("Não foi possível remover este responsável.");
      setAssignees(previous);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Carregando responsáveis...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Responsáveis
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {assignees.map((assignee) => (
          <div
            key={assignee.userId}
            className="group relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white"
            title={assignee.name}
          >
            {initials(assignee.name)}
            <button
              type="button"
              aria-label={`Remover ${assignee.name}`}
              onClick={() => handleUnassign(assignee.userId)}
              className="invisible absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white group-hover:visible"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setPicking((prev) => !prev)}
            aria-label="Adicionar responsável"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400"
          >
            +
          </button>

          {picking && (
            <div className="absolute left-0 top-9 z-10 w-48 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {availableMembers.length === 0 ? (
                <p className="p-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Nenhum membro disponível.
                </p>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => handleAssign(member.userId)}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {member.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
