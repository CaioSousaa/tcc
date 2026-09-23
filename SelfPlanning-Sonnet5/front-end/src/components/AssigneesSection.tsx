"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/avatar";
import { BoardMember } from "@/lib/board-members";

interface Assignee {
  userId: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface AssigneesSectionProps {
  boardId: string;
  cardId: string;
}

export function AssigneesSection({ boardId, cardId }: AssigneesSectionProps) {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/boards/${boardId}/cards/${cardId}/assignees`),
      api.get(`/boards/${boardId}/members`),
    ]).then(([assigneesResponse, membersResponse]) => {
      if (active) {
        setAssignees(assigneesResponse.data);
        setMembers(membersResponse.data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  async function handleAssign(userId: string) {
    setShowPicker(false);
    const response = await api.post(`/boards/${boardId}/cards/${cardId}/assignees`, { userId });
    setAssignees(response.data);
  }

  async function handleRemove(userId: string) {
    setAssignees((prev) => prev.filter((a) => a.userId !== userId));
    await api.delete(`/boards/${boardId}/cards/${cardId}/assignees/${userId}`);
  }

  const availableMembers = members.filter(
    (member) => !assignees.some((a) => a.userId === member.user.id)
  );

  if (loading) {
    return <p className="mb-4 text-sm text-slate-400">Carregando responsáveis...</p>;
  }

  return (
    <div className="mb-6">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">Responsáveis</span>
      <div className="flex flex-wrap items-center gap-2">
        {assignees.map((assignee) => (
          <button
            key={assignee.userId}
            onClick={() => handleRemove(assignee.userId)}
            title={`${assignee.user.name} — clique para remover`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c3557] text-xs font-semibold text-white hover:bg-red-600"
          >
            {getInitials(assignee.user.name)}
          </button>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowPicker((v) => !v)}
            aria-label="Adicionar responsável"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            +
          </button>

          {showPicker && (
            <div className="absolute left-0 top-9 z-10 w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
              {availableMembers.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-slate-400">Nenhum membro disponível</p>
              ) : (
                availableMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAssign(member.user.id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1c3557] text-[10px] font-semibold text-white">
                      {getInitials(member.user.name)}
                    </span>
                    {member.user.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
