"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Board,
  createBoard,
  deleteBoard,
  fetchBoards,
  updateBoard,
} from "@/lib/boards";

function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<"create" | Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBoards(await fetchBoards());
    } catch {
      setError("Não foi possível carregar seus quadros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-white">
            K
          </span>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Kanbo
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {user?.name}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-8 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Meus quadros
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {boards.length}{" "}
              {boards.length === 1 ? "quadro" : "quadros"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormModal("create")}
            className="rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            + Novo quadro
          </button>
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-400">
            Carregando quadros...
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={() => setFormModal(board)}
                onDelete={() => setBoardToDelete(board)}
              />
            ))}

            <button
              type="button"
              onClick={() => setFormModal("create")}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
            >
              <span className="text-xl leading-none">+</span>
              Criar quadro
            </button>
          </div>
        )}
      </main>

      {formModal && (
        <BoardFormModal
          title={formModal === "create" ? "Novo quadro" : "Editar quadro"}
          submitLabel={formModal === "create" ? "Criar quadro" : "Salvar"}
          initialTitle={formModal === "create" ? "" : formModal.title}
          initialColor={formModal === "create" ? "navy" : formModal.color}
          onClose={() => setFormModal(null)}
          onSubmit={async (values) => {
            if (formModal === "create") {
              const board = await createBoard(values);
              setBoards((prev) => [board, ...prev]);
            } else {
              const board = await updateBoard(formModal.id, values);
              setBoards((prev) =>
                prev.map((item) => (item.id === board.id ? board : item)),
              );
            }
            setFormModal(null);
          }}
        />
      )}

      {boardToDelete && (
        <ConfirmDialog
          title={`Excluir o quadro "${boardToDelete.title}"?`}
          description="Esta ação é irreversível."
          onClose={() => setBoardToDelete(null)}
          onConfirm={async () => {
            await deleteBoard(boardToDelete.id);
            setBoards((prev) =>
              prev.filter((item) => item.id !== boardToDelete.id),
            );
            setBoardToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
