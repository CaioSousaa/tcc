"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/avatar";
import { BoardMember, BoardRole } from "@/lib/board-members";

interface BoardMembersModalProps {
  boardId: string;
  onClose: () => void;
}

export function BoardMembersModal({ boardId, onClose }: BoardMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<BoardRole>("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMember = members.find((m) => m.user.id === user?.id);
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    loadMembers();
  }, [boardId]);

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await api.get(`/boards/${boardId}/members`);
      setMembers(response.data);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setInviting(true);
    try {
      const response = await api.post(`/boards/${boardId}/members`, {
        email: email.trim(),
        role: inviteRole,
      });
      setMembers((prev) => [...prev, response.data]);
      setEmail("");
      setInviteRole("member");
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Não foi possível convidar o membro";
      setError(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, role: BoardRole) {
    setError(null);
    try {
      const response = await api.patch(`/boards/${boardId}/members/${memberId}`, { role });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? response.data : m)));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Não foi possível alterar o papel";
      setError(message);
    }
  }

  async function handleRemove(memberId: string) {
    setError(null);
    try {
      await api.delete(`/boards/${boardId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        "Não foi possível remover o membro";
      setError(message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Membros do quadro</h2>
          <button onClick={onClose} aria-label="Fechar" className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Administradores convidam e gerenciam membros. Membros podem ser atribuídos como
          responsáveis em cards.
        </p>

        {isAdmin && (
          <form onSubmit={handleInvite} className="mb-5 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail do convidado"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as BoardRole)}
              className="rounded-md border border-slate-300 bg-white px-2 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="shrink-0 rounded-md bg-[#1c3557] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
            >
              {inviting ? "Convidando..." : "Convidar"}
            </button>
          </form>
        )}

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Carregando membros...</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c3557] text-xs font-semibold text-white">
                    {getInitials(member.user.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{member.user.name}</p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {member.user.id === user?.id ? "você" : "ativo"}
                  </span>
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as BoardRole)}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                    >
                      <option value="member">Membro</option>
                      <option value="admin">Administrador</option>
                    </select>
                  ) : (
                    <span className="text-sm text-slate-600">
                      {member.role === "admin" ? "Administrador" : "Membro"}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      aria-label="Remover membro"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
