"use client";

import { useState } from "react";
import { useMemberManagement } from "@/hooks/useMemberManagement";

interface Member {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  status: string;
  created_at: string;
}

interface MemberRowProps {
  member: Member;
  boardId: string;
  onUpdate: () => Promise<void>;
}

export default function MemberRow({ member, boardId, onUpdate }: MemberRowProps) {
  const { changeRole, removeMember, loading, error } = useMemberManagement(boardId);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleChangeRole = async (newRole: string) => {
    try {
      await changeRole(member.id, newRole);
      setShowRoleMenu(false);
      await onUpdate();
    } catch (err) {
      // Error is handled by useMemberManagement
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember(member.id);
      setShowDeleteConfirm(false);
      await onUpdate();
    } catch (err) {
      // Error is handled by useMemberManagement
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{member.name}</div>
        <div className="text-xs text-gray-500">
          {member.status === "active" ? "Ativo" : "Pendente"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            {member.role === "admin"
              ? "Admin"
              : member.role === "editor"
              ? "Editor"
              : "Visualizador"}
            ▼
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-300 rounded shadow-lg z-10">
              {["viewer", "editor", "admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => handleChangeRole(role)}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  disabled={loading}
                >
                  {role === "admin"
                    ? "Administrador"
                    : role === "editor"
                    ? "Editor"
                    : "Visualizador"}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 hover:text-red-800 text-sm p-1"
          disabled={loading}
          title="Remover"
        >
          ✕
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80">
            <h3 className="font-semibold mb-2">Remover membro?</h3>
            <p className="text-gray-600 text-sm mb-4">
              {member.name} será removido do quadro.
            </p>

            {error && (
              <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
              >
                {loading ? "Removendo..." : "Remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
