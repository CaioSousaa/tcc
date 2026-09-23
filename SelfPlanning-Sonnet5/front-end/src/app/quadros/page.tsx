"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { BoardFormModal } from "@/components/BoardFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/avatar";
import { Board, BOARD_COLOR_CLASSES, BoardColor, BoardSummary } from "@/lib/board-colors";
import { List } from "@/lib/lists";
import { Card } from "@/lib/cards";
import { BoardMember } from "@/lib/board-members";

function QuadrosContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [summaries, setSummaries] = useState<Record<string, BoardSummary>>({});
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  const [deleting, setDeleting] = useState(false);

  const visibleBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const adminCount = Object.values(summaries).filter((s) => s.role === "admin").length;

  useEffect(() => {
    loadBoards();
  }, []);

  async function loadBoards() {
    setLoadingBoards(true);
    try {
      const response = await api.get("/boards");
      const fetchedBoards: Board[] = response.data;
      setBoards(fetchedBoards);
      loadSummaries(fetchedBoards);
    } finally {
      setLoadingBoards(false);
    }
  }

  async function loadSummaries(targetBoards: Board[]) {
    const entries = await Promise.all(
      targetBoards.map(async (board) => {
        const [listsResponse, membersResponse] = await Promise.all([
          api.get(`/boards/${board.id}/lists`),
          api.get(`/boards/${board.id}/members`),
        ]);
        const lists: List[] = listsResponse.data;
        const members: BoardMember[] = membersResponse.data;

        const cardsPerList = await Promise.all(
          lists.map((list) => api.get(`/boards/${board.id}/lists/${list.id}/cards`))
        );
        const cards: Card[] = cardsPerList.flatMap((r) => r.data);
        const role = members.find((m) => m.user.id === user?.id)?.role ?? "member";

        const summary: BoardSummary = {
          listCount: lists.length,
          cardCount: cards.length,
          overdueCount: cards.filter((c) => c.isOverdue).length,
          role,
          members: members.map((m) => ({ id: m.user.id, name: m.user.name })),
        };
        return [board.id, summary] as const;
      })
    );
    setSummaries((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  async function handleCreate(name: string, color: BoardColor, createDefaultLists?: boolean) {
    const response = await api.post("/boards", { name, color });
    const created: Board = response.data;

    if (createDefaultLists) {
      await Promise.all(
        ["A fazer", "Em progresso", "Concluído"].map((listName) =>
          api.post(`/boards/${created.id}/lists`, { name: listName })
        )
      );
    }

    setBoards((prev) => [created, ...prev]);
    loadSummaries([created]);
    setShowCreateModal(false);
  }

  async function handleUpdate(name: string, color: BoardColor) {
    if (!editingBoard) return;
    const response = await api.patch(`/boards/${editingBoard.id}`, { name, color });
    setBoards((prev) => prev.map((b) => (b.id === editingBoard.id ? response.data : b)));
    setEditingBoard(null);
  }

  async function handleDelete() {
    if (!deletingBoard) return;
    setDeleting(true);
    try {
      await api.delete(`/boards/${deletingBoard.id}`);
      setBoards((prev) => prev.filter((b) => b.id !== deletingBoard.id));
      setSummaries((prev) => {
        const next = { ...prev };
        delete next[deletingBoard.id];
        return next;
      });
      setDeletingBoard(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-8 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1c3557] text-sm font-semibold text-white">
            K
          </span>
          <span className="text-lg font-bold text-slate-900">Kanbo</span>
        </div>
        <div className="mx-6 hidden max-w-md flex-1 sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar quadros e cards"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c3557] text-xs font-semibold text-white">
              {user ? getInitials(user.name) : ""}
            </span>
            <span className="text-sm text-slate-600">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meus quadros</h1>
            <p className="mt-1 text-sm text-slate-500">
              {boards.length} {boards.length === 1 ? "quadro" : "quadros"}
              {adminCount > 0 &&
                ` · você é administrador em ${adminCount} ${adminCount === 1 ? "quadro" : "quadros"}`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#1c3557] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162a46]"
          >
            <Plus className="h-4 w-4" />
            Novo quadro
          </button>
        </div>

        {loadingBoards ? (
          <p className="text-sm text-slate-500">Carregando quadros...</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleBoards.map((board) => {
              const summary = summaries[board.id];
              return (
                <div
                  key={board.id}
                  onClick={() => router.push(`/quadros/${board.id}`)}
                  className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm hover:border-slate-300"
                >
                  <div className={`h-1.5 ${BOARD_COLOR_CLASSES[board.color]}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">{board.name}</h3>
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBoard(board);
                          }}
                          aria-label="Editar quadro"
                          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingBoard(board);
                          }}
                          aria-label="Excluir quadro"
                          className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {summary && (
                      <p className="mt-1.5 text-xs text-slate-500">
                        {summary.listCount} {summary.listCount === 1 ? "lista" : "listas"} ·{" "}
                        {summary.cardCount} {summary.cardCount === 1 ? "card" : "cards"}
                        {summary.overdueCount > 0 &&
                          ` · ${summary.overdueCount} ${summary.overdueCount === 1 ? "atrasado" : "atrasados"}`}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {(summary?.members ?? []).slice(0, 4).map((member) => (
                          <span
                            key={member.id}
                            title={member.name}
                            className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#1c3557] text-[10px] font-semibold text-white"
                          >
                            {getInitials(member.name)}
                          </span>
                        ))}
                      </div>
                      {summary && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {summary.role === "admin" ? "Admin" : "Membro"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex min-h-26 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
            >
              <Plus className="h-5 w-5" />
              Criar quadro
            </button>
          </div>
        )}

        {!loadingBoards && visibleBoards.length === 0 && boards.length > 0 && (
          <p className="mt-4 text-sm text-slate-500">Nenhum quadro encontrado para essa busca.</p>
        )}
      </main>

      {showCreateModal && (
        <BoardFormModal
          title="Novo quadro"
          confirmLabel="Criar quadro"
          offerDefaultLists
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingBoard && (
        <BoardFormModal
          title="Editar quadro"
          confirmLabel="Salvar"
          initialName={editingBoard.name}
          initialColor={editingBoard.color}
          onSubmit={handleUpdate}
          onClose={() => setEditingBoard(null)}
        />
      )}

      {deletingBoard && (
        <ConfirmDialog
          title={`Excluir o quadro "${deletingBoard.name}"?`}
          description="Essa ação é irreversível."
          confirmLabel="Excluir"
          submitting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBoard(null)}
        />
      )}
    </div>
  );
}

export default function QuadrosPage() {
  return (
    <RequireAuth>
      <QuadrosContent />
    </RequireAuth>
  );
}
