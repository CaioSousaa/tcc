"use client";

import { useCallback, useEffect, useState } from "react";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { DeleteBoardModal } from "@/components/boards/DeleteBoardModal";
import { PlusIcon } from "@/components/icons";
import {
  createBoard,
  deleteBoard,
  listBoards,
  updateBoard,
  type Board,
  type BoardInput,
} from "@/lib/boards";
import { parseApiError } from "@/lib/errors";

type ModalState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; board: Board }
  | { type: "delete"; board: Board };

export default function QuadrosPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "closed" });

  useEffect(() => {
    let active = true;

    listBoards()
      .then((data) => {
        if (active) {
          setBoards(data);
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(parseApiError(error).message);
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
  }, []);

  const closeModal = useCallback(() => setModal({ type: "closed" }), []);

  async function handleCreate(input: BoardInput) {
    const board = await createBoard(input);
    setBoards((current) => [board, ...current]);
  }

  async function handleUpdate(boardId: string, input: BoardInput) {
    const board = await updateBoard(boardId, input);
    setBoards((current) =>
      current.map((item) => (item.id === board.id ? board : item)),
    );
  }

  async function handleDelete(boardId: string) {
    await deleteBoard(boardId);
    setBoards((current) => current.filter((item) => item.id !== boardId));
  }

  const adminCount = boards.filter((board) => board.role === "admin").length;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight">Meus quadros</h1>
          <p className="mt-1 text-[15px] text-muted">
            {isLoading
              ? "Carregando seus quadros..."
              : `${boards.length} ${boards.length === 1 ? "quadro" : "quadros"} · você é administrador em ${adminCount}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-navy-strong"
        >
          <PlusIcon />
          Novo quadro
        </button>
      </div>

      {loadError ? (
        <p role="alert" className="mt-8 text-sm text-danger">
          {loadError}
        </p>
      ) : null}

      {!isLoading && !loadError ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onEdit={(target) => setModal({ type: "edit", board: target })}
              onDelete={(target) => setModal({ type: "delete", board: target })}
            />
          ))}

          <button
            type="button"
            onClick={() => setModal({ type: "create" })}
            className="grid min-h-[172px] place-items-center rounded-xl border border-dashed border-line text-[15px] text-muted transition hover:border-navy hover:text-foreground"
          >
            <span className="flex flex-col items-center gap-2">
              <PlusIcon />
              Criar quadro
            </span>
          </button>
        </div>
      ) : null}

      {modal.type === "create" ? (
        <BoardFormModal onClose={closeModal} onSubmit={handleCreate} />
      ) : null}

      {modal.type === "edit" ? (
        <BoardFormModal
          board={modal.board}
          onClose={closeModal}
          onSubmit={(input) => handleUpdate(modal.board.id, input)}
        />
      ) : null}

      {modal.type === "delete" ? (
        <DeleteBoardModal
          board={modal.board}
          onClose={closeModal}
          onConfirm={() => handleDelete(modal.board.id)}
        />
      ) : null}
    </>
  );
}
