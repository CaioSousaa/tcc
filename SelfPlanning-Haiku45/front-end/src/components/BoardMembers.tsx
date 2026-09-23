import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBoardMembers, inviteBoardMember, updateBoardMember, removeBoardMember } from "@/lib/api";

interface Owner {
  id: string;
  email: string;
  role: "owner";
}

interface Member {
  id: string;
  userId: string;
  email: string;
  nome: string;
  role: "editor" | "viewer" | "assignee";
}

interface BoardMembersProps {
  boardId: string;
  onClose: () => void;
}

const ROLE_LABELS: Record<Member["role"], string> = {
  editor: "Editor",
  viewer: "Visualizador",
  assignee: "Responsável",
};

const AVATAR_COLORS = ["bg-blue-950", "bg-purple-500", "bg-emerald-500", "bg-orange-400", "bg-pink-500"];

function initialsOf(text: string) {
  return text
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function BoardMembers({ boardId, onClose }: BoardMembersProps) {
  const { user } = useAuth();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Member["role"]>("editor");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [boardId]);

  async function loadMembers() {
    try {
      const res = await getBoardMembers(boardId);
      setOwner(res.data.owner);
      setMembers(res.data.members);
    } catch (err) {
      setError("Erro ao carregar membros");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError("");
    try {
      await inviteBoardMember(boardId, inviteEmail.trim(), inviteRole);
      setInviteEmail("");
      await loadMembers();
    } catch (err) {
      setError("Erro ao convidar membro");
      console.error(err);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, role: Member["role"]) {
    try {
      await updateBoardMember(boardId, memberId, role);
      await loadMembers();
    } catch (err) {
      setError("Erro ao atualizar papel do membro");
      console.error(err);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Remover este membro do quadro?")) return;
    try {
      await removeBoardMember(boardId, memberId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError("Erro ao remover membro");
      console.error(err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">Membros do quadro</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Editores criam e movem cards. Visualizadores só acompanham. Responsáveis podem ser atribuídos a cards.
        </p>

        {error && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

        <form onSubmit={handleInvite} className="flex gap-2 mb-5">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="e-mail do convidado"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-950"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Member["role"])}
            className="px-2 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Visualizador</option>
            <option value="assignee">Responsável</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="px-4 py-2 bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {inviting ? "Convidando..." : "Convidar"}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {owner && (
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-blue-950 text-white text-xs flex items-center justify-center font-bold shrink-0">
                  {initialsOf(owner.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {owner.id === user?.id ? "Você" : owner.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{owner.email}</p>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">Administrador</span>
              </div>
            )}

            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3 p-2">
                <div
                  className={`w-8 h-8 rounded-full text-white text-xs flex items-center justify-center font-bold shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                >
                  {initialsOf(member.nome || member.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.nome}</p>
                  <p className="text-xs text-gray-400 truncate">{member.email}</p>
                </div>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value as Member["role"])}
                  className="px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700"
                >
                  <option value="editor">{ROLE_LABELS.editor}</option>
                  <option value="viewer">{ROLE_LABELS.viewer}</option>
                  <option value="assignee">{ROLE_LABELS.assignee}</option>
                </select>
                <button
                  onClick={() => handleRemove(member.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-red-200 text-red-500 hover:bg-red-50 shrink-0"
                  title="Remover"
                >
                  🗑
                </button>
              </div>
            ))}

            {members.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">Nenhum outro membro ainda</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
