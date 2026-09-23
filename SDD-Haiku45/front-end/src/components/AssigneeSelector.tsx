"use client";

import { useState } from "react";
import { useMembers } from "@/hooks/useMembers";

interface Member {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface AssigneeSelectorProps {
  boardId: string;
  onSelect: (memberId: string) => Promise<void>;
  selectedIds?: string[];
  loading?: boolean;
}

export default function AssigneeSelector({
  boardId,
  onSelect,
  selectedIds = [],
  loading = false,
}: AssigneeSelectorProps) {
  const { members } = useMembers(boardId);
  const [open, setOpen] = useState(false);

  const activeMembers = members.filter((m) => m.status === "active");

  const handleSelect = async (memberId: string) => {
    try {
      await onSelect(memberId);
    } catch (err) {
      // Error is handled by parent
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        disabled={loading}
      >
        Adicionar responsável ▼
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-64 overflow-y-auto">
          {activeMembers.length === 0 ? (
            <div className="p-3 text-gray-500 text-sm text-center">
              Nenhum membro ativo
            </div>
          ) : (
            activeMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  handleSelect(member.id);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 disabled:opacity-50"
                disabled={loading || selectedIds.includes(member.id)}
              >
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-xs text-gray-500">{member.role}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
