"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { LabelsModal } from "@/components/boards/LabelsModal";
import { ListsBoard } from "@/components/boards/ListsBoard";
import { MembersModal } from "@/components/boards/MembersModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { BOARD_COLOR_BORDER_CLASSES } from "@/lib/board-colors";
import { Board, deleteBoard, fetchBoard, updateBoard } from "@/lib/boards";

function BoardDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [managingMembers, setManagingMembers] = useState(false);
  const [managingLabels, setManagingLabels] = useState(false);
  const [labelsRefreshKey, setLabelsRefreshKey] = useState(0);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBoard(await fetchBoard(params.id));
    } catch {
      setError("Quadro não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Link href="/" className="text-sm font-semibold text-slate-800 dark:text-zinc-50">
          Voltar para meus quadros
        </Link>
      </div>
    );
  }

  const canManageBoard = board.role === "owner" || board.role === "admin";
  const isOwner = board.role === "owner";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header
        className={`border-t-4 border-b border-zinc-200 px-8 py-4 dark:border-zinc-800 ${BOARD_COLOR_BORDER_CLASSES[board.color]}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← Quadros
            </Link>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {board.title}
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManagingLabels(true)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Etiquetas
            </button>
            <button
              type="button"
              onClick={() => setManagingMembers(true)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Membros
            </button>
            {canManageBoard && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Editar
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => setDeleting(true)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <ListsBoard
          boardId={board.id}
          canManageLists={canManageBoard}
          labelsRefreshKey={labelsRefreshKey}
        />
      </main>

      {editing && (
        <BoardFormModal
          title="Editar quadro"
          submitLabel="Salvar"
          initialTitle={board.title}
          initialColor={board.color}
          onClose={() => setEditing(false)}
          onSubmit={async (values) => {
            setBoard(await updateBoard(board.id, values));
            setEditing(false);
          }}
        />
      )}

      {managingMembers && (
        <MembersModal
          boardId={board.id}
          canManage={canManageBoard}
          onClose={() => setManagingMembers(false)}
        />
      )}

      {managingLabels && (
        <LabelsModal
          boardId={board.id}
          canManage={canManageBoard}
          onClose={() => setManagingLabels(false)}
          onLabelsChanged={() => setLabelsRefreshKey((prev) => prev + 1)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Excluir o quadro "${board.title}"?`}
          description="Esta ação é irreversível."
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await deleteBoard(board.id);
            router.replace("/");
          }}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <AuthGuard>
      <BoardDetail />
    </AuthGuard>
  );
}
