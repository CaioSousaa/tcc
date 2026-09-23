"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/Alert";
import { ErrorState, LoadingState } from "@/components/LoadState";
import { BoardCard } from "@/components/boards/BoardCard";
import { BoardFormDialog, type BoardFormMode } from "@/components/boards/BoardFormDialog";
import { DeleteBoardDialog } from "@/components/boards/DeleteBoardDialog";
import { NewBoardCard } from "@/components/boards/NewBoardCard";
import { InvitationsSection } from "@/components/invitations/InvitationsSection";
import { PlusIcon } from "@/components/boards/icons";
import { useSearch } from "@/contexts/SearchContext";
import { filterBoardsByName } from "@/lib/boardSearch";
import { isSessionError, toApiError } from "@/lib/api";
import { isBoardNotFound, removeBoard, replaceBoard } from "@/lib/boardsState";
import { localToday } from "@/lib/dueDate";
import { boardsSubtitle, insertBoardFirst } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import type { BoardFormValues } from "@/schemas/board";
import { boardService, type BoardSummary } from "@/services/boardService";

type LoadStatus = "loading" | "error" | "ready";
type FormState = { mode: BoardFormMode; board?: BoardSummary } | null;

export function BoardsView() {
  const router = useRouter();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [form, setForm] = useState<FormState>(null);
  const [deleting, setDeleting] = useState<BoardSummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { query } = useSearch();
  const visibleBoards = filterBoardsByName(boards, query);

  // Loaded once per visit; later changes come from API responses (N27).
  useEffect(() => {
    let cancelled = false;
    boardService
      // The device's today decides which cards are overdue (RF10 F146).
      .list(localToday(new Date()))
      .then((result) => {
        if (cancelled) return;
        setBoards(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled || isSessionError(toApiError(error))) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /** Role changed elsewhere: the refused action shows its message and the grid is refreshed (RF07 F90). */
  const refreshBoards = useCallback(async () => {
    try {
      setBoards(await boardService.list(localToday(new Date())));
    } catch {
      // The grid keeps what it showed; the message already explains the refusal.
    }
  }, []);

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  function openCreate() {
    setNotice(null);
    setForm({ mode: { type: "create" } });
  }

  function openEdit(board: BoardSummary) {
    setNotice(null);
    setForm({
      mode: { type: "edit", name: board.name, color: board.color, lockListDeletion: board.lockListDeletion },
      board,
    });
  }

  async function submitForm(values: BoardFormValues) {
    if (!form) return;

    if (form.mode.type === "create") {
      const created = await boardService.create({
        name: values.name,
        color: values.color,
        withDefaultLists: values.withDefaultLists,
      });
      setForm(null);
      router.push(`/boards/${created.id}`);
      return;
    }

    const target = form.board;
    if (!target) return;
    try {
      const updated = await boardService.update(target.id, {
        name: values.name,
        color: values.color,
        lockListDeletion: values.lockListDeletion,
      });
      setBoards((current) => replaceBoard(current, updated));
      setForm(null);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === "FORBIDDEN") {
        setForm(null);
        setNotice(apiError.message);
        await refreshBoards();
        return;
      }
      if (!isBoardNotFound(apiError)) throw error;
      // Deleted elsewhere: drop the stale card and tell the user (CB11).
      setBoards((current) => removeBoard(current, target.id));
      setForm(null);
      setNotice(MESSAGES.boardNotFound);
    }
  }

  function handleDeleted(board: BoardSummary) {
    setBoards((current) => removeBoard(current, board.id));
    setDeleting(null);
  }

  return (
    <main className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col px-6 py-14 lg:py-[60px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink">Meus quadros</h1>
          {status === "ready" ? <p className="mt-2 text-[15px] text-muted">{boardsSubtitle(boards)}</p> : null}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex h-12 items-center gap-2 rounded-lg bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark"
        >
          <PlusIcon />
          Novo quadro
        </button>
      </div>

      {notice ? (
        <div className="mt-6">
          <Alert>{notice}</Alert>
        </div>
      ) : null}

      {/* Loaded on its own: a failure here never blocks the grid (RF07 F92). */}
      <InvitationsSection onAccepted={(board) => setBoards((current) => insertBoardFirst(current, board))} />

      {status === "loading" ? <LoadingState label="Carregando quadros" /> : null}
      {status === "error" ? <ErrorState onRetry={retry} /> : null}

      {status === "ready" ? (
        <>
          {boards.length === 0 ? <p className="mt-8 text-[15px] text-ink">{MESSAGES.noBoards}</p> : null}
          {boards.length > 0 && visibleBoards.length === 0 ? (
            <p role="status" className="mt-8 text-[15px] text-muted">
              Nenhum quadro encontrado para &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}
          {/* At most 4 boards per row (spec of the prototype); fewer on narrow screens. */}
          <ul className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleBoards.map((board) => (
              <li key={board.id}>
                <BoardCard board={board} onEdit={openEdit} onDelete={setDeleting} />
              </li>
            ))}
            <li>
              <NewBoardCard onClick={openCreate} />
            </li>
          </ul>
        </>
      ) : null}

      {form ? (
        <BoardFormDialog
          key={form.board?.id ?? "create"}
          mode={form.mode}
          onClose={() => setForm(null)}
          onSubmit={submitForm}
        />
      ) : null}

      {deleting ? (
        <DeleteBoardDialog
          board={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={async (board) => {
            try {
              await boardService.remove(board.id);
            } catch (error) {
              // The confirmation shows the refusal; the grid hides actions the role lost (RF07 F90).
              if (toApiError(error).code === "FORBIDDEN") void refreshBoards();
              throw error;
            }
          }}
          onDeleted={handleDeleted}
        />
      ) : null}
    </main>
  );
}
