"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BoardCard } from "@/components/BoardCard";
import { BoardFormModal } from "@/components/BoardFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormMessage } from "@/components/FormMessage";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  Board,
  BoardPayload,
  createBoardRequest,
  deleteBoardRequest,
  listBoardsRequest,
  updateBoardRequest,
} from "@/lib/boardsApi";
import { getErrorMessage } from "@/lib/errors";

export default function BoardsPage() {
  const { isChecking } = useRequireAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [boardUnderEdit, setBoardUnderEdit] = useState<Board | null>(null);
  const [boardUnderDeletion, setBoardUnderDeletion] = useState<Board | null>(null);

  useEffect(() => {
    if (isChecking) {
      return;
    }

    let active = true;

    listBoardsRequest()
      .then((loaded) => {
        if (active) {
          setBoards(loaded);
          setListError("");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setListError(getErrorMessage(error, "Não foi possível carregar seus quadros."));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isChecking]);

  async function handleCreate(payload: BoardPayload): Promise<void> {
    const created = await createBoardRequest(payload);

    setBoards((current) => [created, ...current]);
    setIsCreating(false);
  }

  async function handleUpdate(board: Board, payload: BoardPayload): Promise<void> {
    const updated = await updateBoardRequest(board.id, payload);

    setBoards((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setBoardUnderEdit(null);
  }

  async function handleDelete(board: Board): Promise<void> {
    await deleteBoardRequest(board.id);

    setBoards((current) => current.filter((item) => item.id !== board.id));
    setBoardUnderDeletion(null);
  }

  if (isChecking) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Meus quadros</h1>
            <p className="mt-2 text-sm text-muted">
              {boards.length === 1 ? "1 quadro" : `${boards.length} quadros`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            + Novo quadro
          </button>
        </div>

        {listError ? (
          <div className="mt-8">
            <FormMessage message={listError} />
          </div>
        ) : null}

        {isLoading ? (
          <p className="mt-10 text-sm text-muted">Carregando quadros...</p>
        ) : boards.length === 0 && !listError ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-surface/60 px-6 py-16 text-center">
            <p className="text-base font-semibold text-foreground">
              Você ainda não tem nenhum quadro
            </p>
            <p className="mt-2 text-sm text-muted">
              Crie seu primeiro quadro para organizar listas e cards.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-6 h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Criar quadro
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={setBoardUnderEdit}
                onDelete={setBoardUnderDeletion}
              />
            ))}

            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted transition-colors hover:border-brand hover:text-foreground"
            >
              <span className="text-xl">+</span>
              Criar quadro
            </button>
          </div>
        )}
      </main>

      {isCreating ? (
        <BoardFormModal onClose={() => setIsCreating(false)} onSubmit={handleCreate} />
      ) : null}

      {boardUnderEdit ? (
        <BoardFormModal
          board={boardUnderEdit}
          onClose={() => setBoardUnderEdit(null)}
          onSubmit={(payload) => handleUpdate(boardUnderEdit, payload)}
        />
      ) : null}

      {boardUnderDeletion ? (
        <ConfirmDialog
          title={`Excluir o quadro "${boardUnderDeletion.name}"?`}
          description="Ação irreversível: o quadro e todo o conteúdo dele serão apagados definitivamente."
          confirmLabel="Excluir quadro"
          errorFallback="Não foi possível excluir o quadro."
          onClose={() => setBoardUnderDeletion(null)}
          onConfirm={() => handleDelete(boardUnderDeletion)}
        />
      ) : null}
    </div>
  );
}
