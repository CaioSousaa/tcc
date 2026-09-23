"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/Alert";
import { ErrorState, LoadingState } from "@/components/LoadState";
import { BoardFormDialog } from "@/components/boards/BoardFormDialog";
import { BoardHeader } from "@/components/boards/BoardHeader";
import { BoardNotFound } from "@/components/boards/BoardNotFound";
import { CardDialog } from "@/components/cards/CardDialog";
import { LabelFilterBar } from "@/components/labels/LabelFilterBar";
import { LabelsDialog } from "@/components/labels/LabelsDialog";
import { BoardLists } from "@/components/lists/BoardLists";
import { DeleteListDialog } from "@/components/lists/DeleteListDialog";
import { DeleteListWithCardsDialog } from "@/components/lists/DeleteListWithCardsDialog";
import { ListFormDialog, type ListFormMode } from "@/components/lists/ListFormDialog";
import { MembersDialog } from "@/components/members/MembersDialog";
import { useAuth } from "@/contexts/AuthContext";
import { isSessionError, toApiError, type ApiError } from "@/lib/api";
import { replaceLists, withLists } from "@/lib/boardState";
import { isBoardNotFound } from "@/lib/boardsState";
import { cardFailureAction, type CardOperation } from "@/lib/cardsState";
import { withCardChecklist } from "@/lib/checklist";
import { withCardCommentCount } from "@/lib/comments";
import { projectLists } from "@/lib/dueDate";
import {
  NO_SELECTION,
  countCards,
  pruneSelection,
  toggleSelection,
  withCardLabels,
  withLabels,
  withoutLabel,
  type LabelSelection,
} from "@/lib/labels";
import { listDeletionFailureAction } from "@/lib/listDeletion";
import { deletionDialogFor, listFailureAction, type ListOperation } from "@/lib/listsState";
import { withCardAssignees, withMembersState } from "@/lib/members";
import { MESSAGES } from "@/lib/messages";
import { can } from "@/lib/permissions";
import type { BoardFormValues } from "@/schemas/board";
import type { CardPayload } from "@/schemas/card";
import type { ListFormValues } from "@/schemas/list";
import { boardService, type BoardDetail, type BoardListItem, type CardSummary } from "@/services/boardService";
import { cardService } from "@/services/cardService";
import type { LabelView } from "@/services/labelService";
import { listService, type ListDeletionDecision } from "@/services/listService";

type Status = "loading" | "error" | "not-found" | "ready";

export function BoardView({ boardId }: { boardId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [editingBoard, setEditingBoard] = useState(false);
  const [listForm, setListForm] = useState<ListFormMode | null>(null);
  // Id only: the dialogs read the list from the current board, so a reload refreshes them (RF05 F60).
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Only one "Adicionar card" field is open in the whole board (F42, CA13).
  const [addingListId, setAddingListId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  // Local to this screen: never saved, shared nor sent to the API (RF08 F107, RN09).
  const [selection, setSelection] = useState<LabelSelection>(NO_SELECTION);
  // List that received a card hidden by the filter; cleared on the next action (RF08 F115).
  const [hiddenCardListId, setHiddenCardListId] = useState<string | null>(null);
  // Display-only order by due date, starting off; never saved nor shared (RF10 F147, RN06).
  const [sortByDue, setSortByDue] = useState(false);

  useEffect(() => {
    let cancelled = false;
    boardService
      .get(boardId)
      .then((result) => {
        if (cancelled) return;
        setBoard(result);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const apiError = toApiError(error);
        if (isSessionError(apiError)) return;
        setStatus(isBoardNotFound(apiError) ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, attempt]);

  useEffect(() => {
    if (board) document.title = `${board.name} · Kanbo`;
  }, [board]);

  // A selected label that no longer exists leaves the filter (RF08 C202, CA33, CB16).
  const boardLabels = board?.labels;
  useEffect(() => {
    if (boardLabels) setSelection((current) => pruneSelection(current, boardLabels));
  }, [boardLabels]);

  // Display projection used only by BoardLists (RF08 F108, F109).
  // Label filter, then due date order, re-applied on every board change (RF10 F147, CA24).
  const visibleLists = useMemo(
    () => (board ? projectLists(board.lists, selection, sortByDue) : []),
    [board, selection, sortByDue],
  );

  const retry = useCallback(() => {
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  function showBoardNotFound() {
    setListForm(null);
    setDeletingListId(null);
    setEditingBoard(false);
    setAddingListId(null);
    setOpenCardId(null);
    setMembersOpen(false);
    setLabelsOpen(false);
    setBoard(null);
    setStatus("not-found");
  }

  /** The saved order replaces whatever the page showed (plan F28, CB18). */
  function applyLists(lists: BoardListItem[]) {
    setBoard((current) => (current ? withLists(current, lists) : current));
  }

  /** Only the lists returned by a card operation are replaced (RF04 F47, CB21). */
  function applyAffectedLists(lists: BoardListItem[]) {
    setBoard((current) => (current ? replaceLists(current, lists) : current));
  }

  /** Reload in place, without the loading screen, after a list vanished elsewhere (CB14, CB15). */
  async function reloadBoard() {
    try {
      setBoard(await boardService.get(boardId));
    } catch (error) {
      const apiError = toApiError(error);
      if (isBoardNotFound(apiError)) showBoardNotFound();
    }
  }

  /**
   * FORBIDDEN on any board action: the role changed elsewhere. The message is shown
   * and the board is reloaded, which updates `myRole` and hides the controls; dialogs
   * of actions the role no longer allows close with it (RF07 F90, CA40).
   */
  async function handleForbidden(message: string) {
    setLabelsOpen(false);
    setListForm(null);
    setDeletingListId(null);
    setEditingBoard(false);
    setNotice(message);
    await reloadBoard();
  }

  /** Returns normally when the failure was fully handled here; rethrows when the dialog must show it. */
  async function handleListFailure(operation: ListOperation, error: unknown) {
    const apiError = toApiError(error);
    if (apiError.code === "FORBIDDEN") {
      await handleForbidden(apiError.message);
      return;
    }
    switch (listFailureAction(operation, apiError)) {
      case "board-not-found":
        showBoardNotFound();
        return;
      case "reload":
        setDeletingListId(null);
        await reloadBoard();
        return;
      case "reload-with-notice":
        setListForm(null);
        setNotice(MESSAGES.listNotFound);
        await reloadBoard();
        return;
      default:
        throw error;
    }
  }

  async function saveBoard(values: BoardFormValues) {
    try {
      const updated = await boardService.update(boardId, {
        name: values.name,
        color: values.color,
        lockListDeletion: values.lockListDeletion,
      });
      // Only name, color and the deletion lock change; the lists shown stay as they are (RF02 CA26).
      setBoard((current) => (current ? { ...current, ...updated, lists: current.lists } : current));
      setEditingBoard(false);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === "FORBIDDEN") {
        await handleForbidden(apiError.message);
        return;
      }
      if (!isBoardNotFound(apiError)) throw error;
      showBoardNotFound();
    }
  }

  async function saveList(values: ListFormValues) {
    if (!listForm) return;
    const operation: ListOperation = listForm.type === "create" ? "create" : "update";
    try {
      const result =
        listForm.type === "create"
          ? await listService.create(boardId, values)
          : await listService.update(boardId, listForm.list.id, values);
      applyLists(result.lists);
      setListForm(null);
    } catch (error) {
      await handleListFailure(operation, error);
    }
  }

  async function deleteList(list: BoardListItem) {
    try {
      applyLists(await listService.remove(boardId, list.id));
      setDeletingListId(null);
    } catch (error) {
      // LIST_NOT_FOUND counts as deleted (RN15); other failures stay in the dialog.
      await handleListFailure("delete", error);
    }
  }

  /** Deletion of a list with cards with the confirmed rule (RF05, plan F61). */
  async function deleteListWithCards(list: BoardListItem, decision: ListDeletionDecision) {
    try {
      applyLists(await listService.remove(boardId, list.id, decision));
      setDeletingListId(null);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === "FORBIDDEN") {
        await handleForbidden(apiError.message);
        return;
      }
      switch (listDeletionFailureAction(apiError)) {
        case "board-not-found":
          showBoardNotFound();
          return;
        case "close-and-reload":
          setDeletingListId(null);
          await reloadBoard();
          return;
        case "stay-and-reload":
          await reloadBoard();
          throw error;
        default:
          throw error;
      }
    }
  }

  /**
   * Applies the RF04 F48 table. Returns normally when the failure was fully
   * handled here; rethrows when the form or dialog must show the message.
   */
  async function handleCardFailure(operation: CardOperation, error: unknown) {
    const apiError = toApiError(error);
    if (apiError.code === "FORBIDDEN") {
      // Cards are open to every role today; a refusal still refreshes the role (RF07 F90).
      await reloadBoard();
      throw error;
    }
    switch (cardFailureAction(operation, apiError)) {
      case "board-not-found":
        showBoardNotFound();
        return;
      case "deleted":
        setOpenCardId(null);
        await reloadBoard();
        return;
      case "close-and-reload":
        setAddingListId(null);
        setOpenCardId(null);
        setNotice(apiError.message);
        await reloadBoard();
        return;
      case "stay-and-reload":
        await reloadBoard();
        throw error;
      default:
        throw error;
    }
  }

  async function addCard(listId: string, title: string) {
    try {
      const result = await cardService.create(boardId, listId, title);
      applyAffectedLists(result.lists);
      // A new card has no labels, so an active filter hides it (RF08 CA31).
      setHiddenCardListId(selection.size > 0 ? listId : null);
    } catch (error) {
      await handleCardFailure("create", error);
    }
  }

  function handleCardLoadFailure(error: ApiError): boolean {
    const action = cardFailureAction("open", error);
    if (action === "stay") return false;
    void handleCardFailure("open", error).catch(() => undefined);
    return true;
  }

  async function saveCard(cardId: string, payload: CardPayload) {
    try {
      const result = await cardService.update(boardId, cardId, payload);
      applyAffectedLists(result.lists);
      setOpenCardId(null);
    } catch (error) {
      await handleCardFailure("save", error);
    }
  }

  async function deleteCard(cardId: string) {
    try {
      applyAffectedLists(await cardService.remove(boardId, cardId));
      setOpenCardId(null);
    } catch (error) {
      await handleCardFailure("delete", error);
    }
  }

  function startAddingCard(listId: string) {
    setNotice(null);
    setHiddenCardListId(null);
    setAddingListId(listId);
  }

  function openCard(card: CardSummary) {
    setNotice(null);
    setHiddenCardListId(null);
    setAddingListId(null);
    setOpenCardId(card.id);
  }

  function openListForm(mode: ListFormMode) {
    setNotice(null);
    setHiddenCardListId(null);
    setListForm(mode);
  }

  function requestListDeletion(list: BoardListItem) {
    setNotice(null);
    setHiddenCardListId(null);
    setDeletingListId(list.id);
  }

  function changeSelection(next: LabelSelection) {
    setHiddenCardListId(null);
    setSelection(next);
  }

  /** Saved labels with usage replace the page state (RF08 F110). */
  function applyLabels(labels: LabelView[]) {
    setBoard((current) => (current ? withLabels(current, labels) : current));
  }

  /** A deleted label leaves the board, the cards and the filter (RF08 CA17, CA33). */
  function applyLabelDeleted(labelId: string, labels: LabelView[]) {
    setBoard((current) => (current ? withoutLabel(withLabels(current, labels), labelId) : current));
  }

  // Controls and dialogs follow the role returned by the API (RF07 F88, F89).
  const canManageLists = board ? can(board.myRole, "list.manage") : false;
  const canEditBoard = board ? can(board.myRole, "board.update") : false;
  const canManageLabels = board ? can(board.myRole, "labels.manage") : false;

  // Closes by itself when the list vanished after a reload (RF05 F60, CA27).
  const deletingList = deletingListId ? (board?.lists.find((list) => list.id === deletingListId) ?? null) : null;

  if (status === "loading") return <LoadingState label="Carregando quadro" />;
  if (status === "error") return <ErrorState onRetry={retry} />;
  if (status === "not-found" || !board) return <BoardNotFound />;

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <BoardHeader
        board={board}
        onEdit={() => setEditingBoard(true)}
        onOpenMembers={() => {
          setNotice(null);
          setHiddenCardListId(null);
          setMembersOpen(true);
        }}
        onOpenLabels={() => {
          setNotice(null);
          setHiddenCardListId(null);
          setLabelsOpen(true);
        }}
      />

      <LabelFilterBar
        labels={board.labels}
        selection={selection}
        onToggle={(labelId) => changeSelection(toggleSelection(selection, labelId))}
        onClear={() => changeSelection(NO_SELECTION)}
        visible={countCards(visibleLists)}
        total={countCards(board.lists)}
        sortByDue={sortByDue}
        onToggleSortByDue={() => {
          setHiddenCardListId(null);
          setSortByDue((current) => !current);
        }}
      />

      <main className="min-w-0 flex-1 px-6 py-6 lg:px-8">
        {notice ? (
          <div className="mb-5 max-w-2xl">
            <Alert>{notice}</Alert>
          </div>
        ) : null}

        <BoardLists
          lists={visibleLists}
          onAdd={() => openListForm({ type: "create" })}
          // Dialogs always get the full list, never the filtered projection (RF08 F109).
          onEdit={(list) => openListForm({ type: "edit", list: board.lists.find((item) => item.id === list.id) ?? list })}
          onDelete={requestListDeletion}
          canManage={canManageLists}
          cardActions={{
            members: board.members,
            labels: board.labels,
            hiddenCardListId,
            addingListId,
            onStartAdd: startAddingCard,
            onCancelAdd: () => setAddingListId(null),
            onAddCard: addCard,
            onOpenCard: openCard,
          }}
        />
      </main>

      {editingBoard && canEditBoard ? (
        <BoardFormDialog
          mode={{ type: "edit", name: board.name, color: board.color, lockListDeletion: board.lockListDeletion }}
          onClose={() => setEditingBoard(false)}
          onSubmit={saveBoard}
        />
      ) : null}

      {listForm && canManageLists ? (
        <ListFormDialog
          key={listForm.type === "edit" ? listForm.list.id : "create"}
          mode={listForm}
          lists={board.lists}
          onClose={() => setListForm(null)}
          onSubmit={saveList}
        />
      ) : null}

      {openCardId ? (
        <CardDialog
          key={openCardId}
          boardId={boardId}
          cardId={openCardId}
          lists={board.lists}
          onClose={() => setOpenCardId(null)}
          onLoadFailure={handleCardLoadFailure}
          onSave={(payload) => saveCard(openCardId, payload)}
          onDelete={() => deleteCard(openCardId)}
          onChecklistChange={(summary) =>
            setBoard((current) => (current ? withCardChecklist(current, openCardId, summary) : current))
          }
          members={board.members}
          onAssigneesChange={(assigneeIds) =>
            setBoard((current) => (current ? withCardAssignees(current, openCardId, assigneeIds) : current))
          }
          onMembersStale={() => void reloadBoard()}
          myRole={board.myRole}
          labels={board.labels}
          onLabelsChange={applyLabels}
          onLabelDeleted={applyLabelDeleted}
          onCardLabelsChange={(labelIds) =>
            setBoard((current) => (current ? withCardLabels(current, openCardId, labelIds) : current))
          }
          onForbidden={(message) => void handleForbidden(message)}
          currentUser={user ? { id: user.id, name: user.name } : null}
          onCommentCountChange={(count) =>
            setBoard((current) => (current ? withCardCommentCount(current, openCardId, count) : current))
          }
          onRoleStale={() => void reloadBoard()}
        />
      ) : null}

      {labelsOpen && canManageLabels ? (
        <LabelsDialog
          boardId={boardId}
          mode={{ kind: "manage" }}
          myRole={board.myRole}
          initialLabels={board.labels}
          onClose={() => setLabelsOpen(false)}
          onLabelsChange={applyLabels}
          onLabelDeleted={applyLabelDeleted}
          onCardLabelsChange={() => undefined}
          onForbidden={(message) => void handleForbidden(message)}
          onBoardGone={showBoardNotFound}
          onCardGone={() => undefined}
        />
      ) : null}

      {membersOpen ? (
        <MembersDialog
          boardId={boardId}
          boardName={board.name}
          currentUserId={user?.id}
          onClose={() => setMembersOpen(false)}
          onStateChange={(state) => setBoard((current) => (current ? withMembersState(current, state) : current))}
          onForbidden={() => void reloadBoard()}
          onBoardGone={showBoardNotFound}
          onLeft={() => router.push("/boards")}
        />
      ) : null}

      {deletingList && canManageLists && deletionDialogFor(deletingList) === "simple" ? (
        <DeleteListDialog list={deletingList} onClose={() => setDeletingListId(null)} onConfirm={deleteList} />
      ) : null}

      {deletingList && canManageLists && deletionDialogFor(deletingList) === "decision" ? (
        <DeleteListWithCardsDialog
          key={deletingList.id}
          list={deletingList}
          lists={board.lists}
          locked={board.lockListDeletion}
          onClose={() => setDeletingListId(null)}
          onConfirm={(decision) => deleteListWithCards(deletingList, decision)}
        />
      ) : null}
    </div>
  );
}
