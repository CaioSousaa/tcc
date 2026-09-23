"use client";

import { FormEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button, IconButton } from "@/components/ui/button";
import { Select, TextInput } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { Board, BoardMemberRole } from "@/lib/boards/api";
import { Member } from "@/lib/boards-members/api";
import { useAuth } from "@/lib/auth/auth-context";

export function MembersModal({
  board,
  members,
  onClose,
  onInvite,
  onChangeRole,
  onRemove,
}: {
  board: Board;
  members: Member[];
  onClose: () => void;
  onInvite: (email: string, role: BoardMemberRole) => Promise<void>;
  onChangeRole: (userId: string, role: BoardMemberRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const isAdmin = board.role === "administrador";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardMemberRole>("membro");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await onInvite(email, role);
      setEmail("");
      setRole("membro");
    } catch {
      setError("Não foi possível adicionar esse membro.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <Modal title="Membros do quadro" onClose={onClose} width="md">
      <p className="mb-4 text-sm text-muted">
        Administradores gerenciam listas, etiquetas e membros. Membros editam cards.
      </p>

      {isAdmin && (
        <form onSubmit={handleInvite} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="e-mail do convidado"
            className="flex-1"
            required
          />
          <Select
            value={role}
            onChange={(event) => setRole(event.target.value as BoardMemberRole)}
            className="sm:w-40"
          >
            <option value="membro">Membro</option>
            <option value="administrador">Administrador</option>
          </Select>
          <Button type="submit" disabled={inviting}>
            {inviting ? "Convidando..." : "Convidar"}
          </Button>
        </form>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li
            key={member.userId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <Avatar id={member.userId} name={member.name} />
              <div>
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">
                {member.userId === user?.id ? "você" : "ativo"}
              </span>
              {isAdmin ? (
                <>
                  <Select
                    value={member.role}
                    onChange={(event) =>
                      onChangeRole(member.userId, event.target.value as BoardMemberRole)
                    }
                    className="w-auto py-1 text-xs"
                  >
                    <option value="membro">Membro</option>
                    <option value="administrador">Administrador</option>
                  </Select>
                  {member.userId !== user?.id && (
                    <IconButton
                      type="button"
                      variant="danger"
                      onClick={() => onRemove(member.userId)}
                      aria-label={`Remover ${member.name}`}
                    >
                      🗑
                    </IconButton>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted">{member.role}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
