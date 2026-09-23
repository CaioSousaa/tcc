"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { FormMessage } from "./FormMessage";
import { Modal } from "./Modal";
import {
  BoardMember,
  MemberRole,
  inviteMemberRequest,
  removeMemberRequest,
  updateMemberRoleRequest,
} from "@/lib/membersApi";
import { getErrorMessage } from "@/lib/errors";

interface BoardMembersModalProps {
  boardId: string;
  members: BoardMember[];
  currentUserId: string | null;
  isAdmin: boolean;
  onClose: () => void;
  onMembersChange: (members: BoardMember[]) => void;
}

export function BoardMembersModal({
  boardId,
  members,
  currentUserId,
  isAdmin,
  onClose,
  onMembersChange,
}: BoardMembersModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const [memberUnderRemoval, setMemberUnderRemoval] = useState<BoardMember | null>(null);
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function run(
    action: () => Promise<BoardMember[]>,
    fallback: string
  ): Promise<boolean> {
    setError("");
    setIsBusy(true);

    try {
      onMembersChange(await action());

      return true;
    } catch (actionError) {
      setError(getErrorMessage(actionError, fallback));

      return false;
    } finally {
      setIsBusy(false);
    }
  }

  async function handleInvite(): Promise<void> {
    if (email.trim().length === 0) {
      return;
    }

    const succeeded = await run(
      () => inviteMemberRequest(boardId, email.trim(), role),
      "Não foi possível convidar este e-mail."
    );

    if (succeeded) {
      setEmail("");
    }
  }

  async function handleRemove(member: BoardMember): Promise<void> {
    setMemberUnderRemoval(null);

    await run(
      () => removeMemberRequest(boardId, member.id),
      "Não foi possível remover este membro."
    );
  }

  return (
    <Modal title="Membros do quadro" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-muted">
          Administradores gerenciam listas, etiquetas e membros. Membros editam cards.
        </p>

        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleInvite();
                }
              }}
              placeholder="e-mail do convidado"
              className="h-11 min-w-48 flex-1 rounded-lg border border-border bg-surface px-3.5 text-sm outline-none focus:border-brand"
            />
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as MemberRole)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-brand"
            >
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            <button
              type="button"
              onClick={() => void handleInvite()}
              disabled={isBusy || email.trim().length === 0}
              className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              Convidar
            </button>
          </div>
        ) : null}

        {error ? <FormMessage message={error} /> : null}

        <ul className="flex flex-col divide-y divide-border">
          {members.map((member) => {
            const isYou = member.userId !== null && member.userId === currentUserId;

            return (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Avatar
                  name={member.name}
                  email={member.email}
                  muted={member.status === "pending"}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {member.name ?? member.email}
                  </p>
                  <p className="truncate text-xs text-muted">{member.email}</p>
                </div>

                <span className="hidden text-xs text-muted sm:block">
                  {isYou ? "você" : member.status === "pending" ? "convite pendente" : "ativo"}
                </span>

                {isAdmin ? (
                  <>
                    <select
                      value={member.role}
                      disabled={isBusy}
                      onChange={(event) =>
                        void run(
                          () =>
                            updateMemberRoleRequest(
                              boardId,
                              member.id,
                              event.target.value as MemberRole
                            ),
                          "Não foi possível alterar o papel."
                        )
                      }
                      aria-label={`Papel de ${member.name ?? member.email}`}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                    >
                      <option value="member">Membro</option>
                      <option value="admin">Administrador</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setMemberUnderRemoval(member)}
                      aria-label={`Remover ${member.name ?? member.email}`}
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-red-700"
                    >
                      🗑
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-semibold tracking-widest text-muted">
                    {member.role === "admin" ? "ADMIN" : "MEMBRO"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {memberUnderRemoval ? (
          <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Remover {memberUnderRemoval.name ?? memberUnderRemoval.email} do quadro? As
              atribuições dessa pessoa nos cards também serão apagadas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberUnderRemoval(null)}
                className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleRemove(memberUnderRemoval)}
                className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800"
              >
                Remover
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
