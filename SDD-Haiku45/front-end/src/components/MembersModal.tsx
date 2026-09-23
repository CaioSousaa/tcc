"use client";

import { useEffect, useState } from "react";
import { useMembers } from "@/hooks/useMembers";
import { useMemberManagement } from "@/hooks/useMemberManagement";
import { useAuth } from "@/hooks/useAuth";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
};

interface MembersModalProps {
  boardId: string;
  onClose: () => void;
}

export function MembersModal({ boardId, onClose }: MembersModalProps) {
  const { members = [], invitations = [], loading, refetch } = useMembers(boardId);
  const { invite, loading: actionLoading } = useMemberManagement(boardId);

  const { user } = useAuth();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!email.trim()) {
      setInviteError("Email é obrigatório");
      return;
    }

    try {
      await invite(email, role);
      setEmail("");
      setRole("editor");
      await refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao convidar";
      setInviteError(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Membros do quadro</h2>
            <p className="text-sm text-gray-600">
              Administradores gerenciam listas, etiquetas e membros. Editores editam cards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 pt-4 border-t">
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              placeholder="e-mail do convidado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
              disabled={actionLoading}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
              disabled={actionLoading}
            >
              <option value="viewer">Visualizador</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 disabled:bg-gray-400 text-sm"
            >
              Convidar
            </button>
          </div>

          {inviteError && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
              {inviteError}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4 text-gray-500">Carregando membros...</div>
        ) : (
          <>
            <div className="space-y-2">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{member.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {member.user_id === user?.id ? "você" : ""}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {invitations.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Convites Pendentes</h3>
                <div className="space-y-2">
                  {invitations.map((inv: any) => (
                    <div
                      key={inv.id}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                    >
                      <div className="font-medium text-gray-900">{inv.email}</div>
                      <div className="text-xs text-gray-500">convite pendente</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
