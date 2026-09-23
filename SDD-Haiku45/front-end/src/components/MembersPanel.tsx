"use client";

import { useState } from "react";
import { useMembers } from "@/hooks/useMembers";
import { useMemberManagement } from "@/hooks/useMemberManagement";
import MemberRow from "./MemberRow";

interface MembersPanelProps {
  boardId: string;
}

export default function MembersPanel({ boardId }: MembersPanelProps) {
  const { members, invitations, loading, error, refetch } = useMembers(boardId);
  const { invite, loading: inviteLoading, error: inviteError, clearError } = useMemberManagement(boardId);

  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [filter, setFilter] = useState<"all" | "active" | "pending">("all");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await invite(email, role);
      setEmail("");
      setRole("editor");
      setShowModal(false);
      await refetch();
    } catch (err) {
      // Error is handled by useMemberManagement
    }
  };

  const filteredMembers = members.filter((m) => {
    if (filter === "active") return m.status === "active";
    if (filter === "pending") return m.status === "invite_pending";
    return true;
  });

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Carregando membros...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Membros</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          + Convidar
        </button>
      </div>

      {(error || inviteError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error || inviteError}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {["all", "active", "pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded text-sm ${
              filter === f
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Pendentes"}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredMembers.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            boardId={boardId}
            onUpdate={refetch}
          />
        ))}

        {invitations.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Convites Pendentes</h3>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
              >
                <div className="font-medium text-gray-900">{inv.email}</div>
                <div className="text-gray-500">Papel: {inv.role}</div>
                <div className="text-gray-400 text-xs">
                  Expira em: {new Date(inv.expires_at).toLocaleDateString("pt-BR")}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMembers.length === 0 && invitations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum membro encontrado
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Convidar Membro</h3>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Papel
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {inviteError && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {inviteError}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    clearError();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviteLoading ? "Enviando..." : "Convidar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
