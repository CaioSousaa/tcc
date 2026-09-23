"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  BoardMember,
  fetchMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/lib/board-members";

const ROLE_LABELS: Record<string, string> = {
  owner: "Administrador",
  admin: "Administrador",
  member: "Membro",
};

interface MembersModalProps {
  boardId: string;
  canManage: boolean;
  onClose: () => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function MembersModal({
  boardId,
  canManage,
  onClose,
}: MembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMembers(await fetchMembers(boardId));
    } catch {
      setError("Não foi possível carregar os membros.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    try {
      await inviteMember(boardId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail("");
      setInviteRole("member");
      await loadMembers();
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Não foi possível convidar este usuário.";
      setError(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(userId: string, role: "admin" | "member") {
    try {
      await updateMemberRole(boardId, userId, role);
      await loadMembers();
    } catch {
      setError("Não foi possível atualizar o papel do membro.");
    }
  }

  async function handleRemove(userId: string) {
    try {
      await removeMember(boardId, userId);
      setMembers((prev) => prev.filter((member) => member.userId !== userId));
    } catch {
      setError("Não foi possível remover este membro.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Membros do quadro
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Administradores gerenciam listas, etiquetas e membros. Membros
          editam cards.
        </p>

        {canManage && (
          <form onSubmit={handleInvite} className="mt-4 flex gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              disabled={inviting}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="e-mail do convidado"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
            <select
              value={inviteRole}
              disabled={inviting}
              onChange={(event) =>
                setInviteRole(event.target.value as "admin" | "member")
              }
              className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 outline-none focus:border-slate-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Convidar
            </button>
          </form>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Carregando membros...
            </p>
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                  {initials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {member.email}
                  </p>
                </div>
                {member.userId === user?.id && (
                  <span className="shrink-0 text-xs text-zinc-400">você</span>
                )}

                {canManage && !member.isOwner ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      handleRoleChange(
                        member.userId,
                        event.target.value as "admin" | "member",
                      )
                    }
                    className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                ) : (
                  <span className="shrink-0 text-xs uppercase tracking-wide text-zinc-400">
                    {ROLE_LABELS[member.role]}
                  </span>
                )}

                {canManage && !member.isOwner && (
                  <button
                    type="button"
                    aria-label="Remover membro"
                    onClick={() => handleRemove(member.userId)}
                    className="shrink-0 rounded-md border border-red-300 p-1.5 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
