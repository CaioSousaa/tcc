"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { BoardCard, CreateBoardCard } from "@/components/boards/board-card";
import { NewBoardModal } from "@/components/boards/new-board-modal";
import { EditBoardModal } from "@/components/boards/edit-board-modal";
import { useAuth } from "@/lib/auth/auth-context";
import { Board, deleteBoard, listBoards } from "@/lib/boards/api";
import { parseApiError } from "@/lib/auth/errors";

function BoardsDashboard() {
  const { user, logout } = useAuth();

  const [boards, setBoards] = useState<Board[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  useEffect(() => {
    let cancelled = false;
    listBoards()
      .then((data) => {
        if (!cancelled) setBoards(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(parseApiError(error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBoards = useMemo(() => {
    if (!boards) return boards;
    const term = search.trim().toLowerCase();
    if (!term) return boards;
    return boards.filter((board) => board.name.toLowerCase().includes(term));
  }, [boards, search]);

  const adminCount = boards?.filter((b) => b.role === "administrador").length ?? 0;

  async function handleDelete(board: Board) {
    const confirmed = window.confirm(
      `Excluir o quadro "${board.name}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    try {
      await deleteBoard(board.id);
      setBoards((current) => current?.filter((b) => b.id !== board.id) ?? current);
    } catch (error) {
      window.alert(parseApiError(error).message);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3 sm:px-10">
        <Logo />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar quadros e cards"
          className="hidden w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:border-brand focus:outline-none sm:block"
        />
        <div className="flex items-center gap-3">
          <Avatar id={user?.id ?? ""} name={user?.name ?? "?"} />
          <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
          <Button type="button" variant="outline" onClick={() => logout()}>
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus quadros</h1>
            <p className="text-sm text-muted">
              {boards === null
                ? "Carregando..."
                : `${boards.length} quadro${boards.length === 1 ? "" : "s"} · você é administrador em ${adminCount}`}
            </p>
          </div>
          <Button type="button" onClick={() => setShowCreate(true)}>
            + Novo quadro
          </Button>
        </div>

        {loadError && <p className="text-sm text-red-600">{loadError}</p>}

        {boards === null && !loadError && <p className="text-sm text-muted">Carregando quadros...</p>}

        {filteredBoards !== null && filteredBoards !== undefined && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBoards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={() => setEditingBoard(board)}
                onDelete={() => handleDelete(board)}
              />
            ))}
            <CreateBoardCard onClick={() => setShowCreate(true)} />
          </div>
        )}
      </main>

      {showCreate && (
        <NewBoardModal
          onClose={() => setShowCreate(false)}
          onCreated={(board) => {
            setBoards((current) => [board, ...(current ?? [])]);
            setShowCreate(false);
          }}
        />
      )}

      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onUpdated={(updated) => {
            setBoards((current) => current?.map((b) => (b.id === updated.id ? updated : b)) ?? current);
            setEditingBoard(null);
          }}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <BoardsDashboard />
    </RequireAuth>
  );
}
