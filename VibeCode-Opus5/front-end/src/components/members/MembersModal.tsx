"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { CloseIcon, TrashIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import {
  type BoardMember,
  type BoardMemberRole,
  type InviteBoardMemberInput,
} from "@/lib/board-members";
import { parseApiError } from "@/lib/errors";

interface MembersModalProps {
  members: BoardMember[];
  currentUserId: string | undefined;
  onClose: () => void;
  onInvite: (input: InviteBoardMemberInput) => Promise<void>;
  onUpdateRole: (memberId: string, role: BoardMemberRole) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
}

const STATUS_LABEL: Record<BoardMember["status"], string> = {
  active: "ativo",
  pending: "convite pendente",
};

export function MembersModal({
  members,
  currentUserId,
  onClose,
  onInvite,
  onUpdateRole,
  onRemove,
}: MembersModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardMemberRole>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [rowError, setRowError] = useState("");

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError("");
    setIsInviting(true);

    try {
      await onInvite({ email, role });
      setEmail("");
      setRole("member");
    } catch (error) {
      setInviteError(parseApiError(error).message);
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(member: BoardMember, newRole: BoardMemberRole) {
    setRowError("");

    try {
      await onUpdateRole(member.id, newRole);
    } catch (error) {
      setRowError(parseApiError(error).message);
    }
  }

  async function handleRemove(member: BoardMember) {
    setRowError("");

    try {
      await onRemove(member.id);
    } catch (error) {
      setRowError(parseApiError(error).message);
    }
  }

  return (
    <Modal
      onClose={onClose}
      width="max-w-[640px]"
      title={
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Membros do quadro
            </h2>
            <p className="mt-1 text-sm text-muted">
              Administradores gerenciam listas e membros. Membros editam
              cards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </div>
      }
    >
      <form
        onSubmit={handleInviteSubmit}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="e-mail do convidado"
          required
          className="w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as BoardMemberRole)}
          className="shrink-0 rounded-lg border border-line bg-background px-3 py-2.5 text-[15px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
        >
          <option value="member">Membro</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          type="submit"
          disabled={isInviting}
          className="shrink-0 rounded-lg bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-navy-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isInviting ? "Convidando..." : "Convidar"}
        </button>
      </form>

      {inviteError ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {inviteError}
        </p>
      ) : null}

      {rowError ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {rowError}
        </p>
      ) : null}

      <ul className="mt-5 flex flex-col gap-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2.5"
          >
            <Avatar
              seed={member.userId ?? member.email}
              name={member.name}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium">
                {member.name ?? member.email}
              </p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>

            <span className="shrink-0 text-xs text-muted">
              {member.userId === currentUserId
                ? "você"
                : STATUS_LABEL[member.status]}
            </span>

            {member.isOwner ? (
              <span className="shrink-0 rounded-lg border border-line bg-background px-3 py-2 text-[15px] text-muted">
                Administrador
              </span>
            ) : (
              <>
                <select
                  value={member.role}
                  onChange={(event) =>
                    handleRoleChange(
                      member,
                      event.target.value as BoardMemberRole,
                    )
                  }
                  className="shrink-0 rounded-lg border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
                >
                  <option value="member">Membro</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  aria-label={`Remover ${member.name ?? member.email}`}
                  title="Remover"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:border-danger hover:text-danger"
                >
                  <TrashIcon />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
