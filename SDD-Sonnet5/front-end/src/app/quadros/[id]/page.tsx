"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/require-auth";
import { BoardTopBar } from "@/components/board/board-topbar";
import { FilterBar } from "@/components/board/filter-bar";
import { AddListColumn, ListColumn } from "@/components/board/list-column";
import { CardDetailModal } from "@/components/board/card-detail-modal";
import { LabelsModal } from "@/components/board/labels-modal";
import { MembersModal } from "@/components/board/members-modal";
import { ListFormModal } from "@/components/board/list-form-modal";
import { DeleteListModal } from "@/components/board/delete-list-modal";
import { EditBoardModal } from "@/components/boards/edit-board-modal";
import { Board, BoardMemberRole, deleteBoard, getBoard } from "@/lib/boards/api";
import {
  Member,
  inviteMember,
  leaveBoard,
  listMembers,
  removeMember,
  updateMemberRole,
} from "@/lib/boards-members/api";
import { List, createList, deleteList, listLists, updateList } from "@/lib/lists/api";
import {
  Card,
  assignCard,
  attachLabel,
  createCard,
  deleteCard,
  detachLabel,
  listCards,
  unassignCard,
  updateCard,
} from "@/lib/cards/api";
import { Label, LabelColor, createLabel, deleteLabel, listLabels, updateLabel } from "@/lib/labels/api";
import { parseApiError } from "@/lib/auth/errors";
import { Button } from "@/components/ui/button";

function BoardDetail({ id }: { id: string }) {
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [lists, setLists] = useState<List[] | null>(null);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [labels, setLabels] = useState<Label[] | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);

  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [labelsModalTarget, setLabelsModalTarget] = useState<"board" | "card" | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditBoard, setShowEditBoard] = useState(false);
  const [listModal, setListModal] = useState<null | { list?: List }>(null);
  const [deleteListTarget, setDeleteListTarget] = useState<List | null>(null);
  const [creatingCardListId, setCreatingCardListId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBoard(id)
      .then((data) => !cancelled && setBoard(data))
      .catch((error) => !cancelled && setLoadError(parseApiError(error).message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    listLists(id)
      .then((data) => !cancelled && setLists(data))
      .catch((error) => !cancelled && setLoadError(parseApiError(error).message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    listMembers(id)
      .then((data) => !cancelled && setMembers(data))
      .catch((error) => !cancelled && setActionError(parseApiError(error).message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    listLabels(id)
      .then((data) => !cancelled && setLabels(data))
      .catch((error) => !cancelled && setActionError(parseApiError(error).message));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!lists) return;
    let cancelled = false;
    Promise.all(lists.map((list) => listCards(id, list.id, labelFilter, sortByDueDate)))
      .then((results) => !cancelled && setCards(results.flat()))
      .catch((error) => !cancelled && setActionError(parseApiError(error).message));
    return () => {
      cancelled = true;
    };
  }, [id, lists, labelFilter, sortByDueDate]);

  const openCard = useMemo(() => cards?.find((c) => c.id === openCardId) ?? null, [cards, openCardId]);

  async function refreshList(listId: string) {
    try {
      const updated = await listCards(id, listId, labelFilter, sortByDueDate);
      setCards((current) => {
        if (!current) return current;
        return [...current.filter((c) => c.listId !== listId), ...updated];
      });
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  // Board

  async function handleDeleteBoard() {
    if (!board) return;
    if (!window.confirm(`Excluir o quadro "${board.name}"? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteBoard(id);
      router.replace("/");
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleLeaveBoard() {
    try {
      await leaveBoard(id);
      router.replace("/");
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  // Members

  async function handleInviteMember(email: string, role: BoardMemberRole) {
    const member = await inviteMember(id, email, role);
    setMembers((current) => [...(current ?? []), member]);
  }

  async function handleChangeMemberRole(userId: string, role: BoardMemberRole) {
    try {
      await updateMemberRole(id, userId, role);
      setMembers((current) => current?.map((m) => (m.userId === userId ? { ...m, role } : m)) ?? current);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleRemoveMember(userId: string) {
    try {
      await removeMember(id, userId);
      setMembers((current) => current?.filter((m) => m.userId !== userId) ?? current);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  // Labels

  async function handleCreateLabel(name: string, color: LabelColor) {
    const label = await createLabel(id, { name, color });
    setLabels((current) => [...(current ?? []), label]);
  }

  function handleRenameLabel(label: Label) {
    const newName = window.prompt("Novo nome da etiqueta", label.name);
    if (newName === null || newName === label.name) return;
    updateLabel(id, label.id, { name: newName })
      .then((updated) => setLabels((current) => current?.map((l) => (l.id === label.id ? updated : l)) ?? current))
      .catch((error) => setActionError(parseApiError(error).message));
  }

  async function handleChangeLabelColor(labelId: string, color: LabelColor) {
    try {
      const updated = await updateLabel(id, labelId, { color });
      setLabels((current) => current?.map((l) => (l.id === labelId ? updated : l)) ?? current);
      setCards(
        (current) =>
          current?.map((c) => ({
            ...c,
            labels: c.labels.map((l) => (l.id === labelId ? { ...l, color } : l)),
          })) ?? current,
      );
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleDeleteLabel(labelId: string) {
    try {
      await deleteLabel(id, labelId);
      setLabels((current) => current?.filter((l) => l.id !== labelId) ?? current);
      setLabelFilter((current) => current.filter((lid) => lid !== labelId));
      setCards(
        (current) => current?.map((c) => ({ ...c, labels: c.labels.filter((l) => l.id !== labelId) })) ?? current,
      );
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleToggleLabelOnCard(cardId: string, labelId: string, attached: boolean) {
    const card = cards?.find((c) => c.id === cardId);
    if (!card) return;
    try {
      if (attached) {
        await detachLabel(id, card.listId, card.id, labelId);
      } else {
        await attachLabel(id, card.listId, card.id, labelId);
      }
      await refreshList(card.listId);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  // Lists

  async function handleCreateOrEditList(input: { name: string; position?: number }, editing?: List) {
    if (editing) {
      await updateList(id, editing.id, input);
    } else {
      await createList(id, { name: input.name });
    }
    const refreshed = await listLists(id);
    setLists(refreshed);
    setListModal(null);
  }

  async function handleConfirmDeleteList() {
    if (!deleteListTarget) return;
    try {
      await deleteList(id, deleteListTarget.id);
      setLists((current) => current?.filter((l) => l.id !== deleteListTarget.id) ?? current);
      setCards((current) => current?.filter((c) => c.listId !== deleteListTarget.id) ?? current);
      setDeleteListTarget(null);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  // Cards

  async function handleCreateCard(listId: string, title: string) {
    setCreatingCardListId(listId);
    try {
      const card = await createCard(id, listId, { title });
      setCards((current) => [...(current ?? []), card]);
    } catch (error) {
      setActionError(parseApiError(error).message);
    } finally {
      setCreatingCardListId(null);
    }
  }

  async function handleSaveCard(card: Card, input: { title: string; description: string | null; dueDate: string | null }) {
    const updated = await updateCard(id, card.listId, card.id, input);
    setCards((current) => current?.map((c) => (c.id === card.id ? updated : c)) ?? current);
  }

  async function handleDeleteCard(card: Card) {
    await deleteCard(id, card.listId, card.id);
    setCards((current) => current?.filter((c) => c.id !== card.id) ?? current);
    setOpenCardId(null);
  }

  async function handleMoveCard(card: Card, targetListId: string) {
    if (targetListId === card.listId) return;
    try {
      const updated = await updateCard(id, card.listId, card.id, { targetListId });
      setCards((current) => current?.map((c) => (c.id === card.id ? updated : c)) ?? current);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleAssign(card: Card, userId: string) {
    try {
      await assignCard(id, card.listId, card.id, userId);
      await refreshList(card.listId);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  async function handleUnassign(card: Card, userId: string) {
    try {
      await unassignCard(id, card.listId, card.id, userId);
      await refreshList(card.listId);
    } catch (error) {
      setActionError(parseApiError(error).message);
    }
  }

  function toggleLabelFilter(labelId: string) {
    setLabelFilter((current) =>
      current.includes(labelId) ? current.filter((lid) => lid !== labelId) : [...current, labelId],
    );
  }

  const cardUsageCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const card of cards ?? []) {
      for (const label of card.labels) {
        counts[label.id] = (counts[label.id] ?? 0) + 1;
      }
    }
    return counts;
  }, [cards]);

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
        <p className="text-sm text-red-600">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => router.replace("/")}>
          Voltar para meus quadros
        </Button>
      </div>
    );
  }

  if (!board || lists === null || members === null || labels === null) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-8">
        <p className="text-sm text-muted">Carregando quadro...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <BoardTopBar
        board={board}
        members={members}
        onEditBoard={() => setShowEditBoard(true)}
        onOpenLabels={() => setLabelsModalTarget("board")}
        onOpenMembers={() => setShowMembersModal(true)}
      />

      <FilterBar
        labels={labels}
        activeLabelIds={labelFilter}
        onToggleLabel={toggleLabelFilter}
        onClear={() => setLabelFilter([])}
        cardCount={cards?.length ?? 0}
        sortByDueDate={sortByDueDate}
        onToggleSort={() => setSortByDueDate((v) => !v)}
      />

      {actionError && (
        <div className="flex items-center justify-between bg-red-50 px-6 py-2 text-sm text-red-700 sm:px-10">
          {actionError}
          <button type="button" onClick={() => setActionError(null)} aria-label="Fechar aviso">
            ✕
          </button>
        </div>
      )}

      <main className="flex flex-1 items-start gap-4 overflow-x-auto p-6 sm:p-10">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            cards={(cards ?? []).filter((c) => c.listId === list.id)}
            commentCounts={{}}
            onOpenCard={(card) => setOpenCardId(card.id)}
            onCreateCard={(title) => handleCreateCard(list.id, title)}
            creatingCard={creatingCardListId === list.id}
            onEditList={() => setListModal({ list })}
            onDeleteList={() => setDeleteListTarget(list)}
          />
        ))}
        <AddListColumn onClick={() => setListModal({})} />
      </main>

      {openCard && (
        <CardDetailModal
          key={openCard.id}
          boardId={id}
          card={openCard}
          lists={lists}
          members={members}
          onClose={() => setOpenCardId(null)}
          onSave={(input) => handleSaveCard(openCard, input)}
          onDelete={() => handleDeleteCard(openCard)}
          onMoveList={(targetListId) => handleMoveCard(openCard, targetListId)}
          onOpenLabels={() => setLabelsModalTarget("card")}
          onAssign={(userId) => handleAssign(openCard, userId)}
          onUnassign={(userId) => handleUnassign(openCard, userId)}
          onProgressChanged={() => refreshList(openCard.listId)}
        />
      )}

      {labelsModalTarget && (
        <LabelsModal
          labels={labels}
          card={labelsModalTarget === "card" && openCard ? openCard : undefined}
          cardUsageCount={cardUsageCount}
          onClose={() => setLabelsModalTarget(null)}
          onCreate={handleCreateLabel}
          onRename={handleRenameLabel}
          onChangeColor={handleChangeLabelColor}
          onDelete={handleDeleteLabel}
          onToggleOnCard={
            openCard ? (labelId, attached) => handleToggleLabelOnCard(openCard.id, labelId, attached) : undefined
          }
        />
      )}

      {showMembersModal && (
        <MembersModal
          board={board}
          members={members}
          onClose={() => setShowMembersModal(false)}
          onInvite={handleInviteMember}
          onChangeRole={handleChangeMemberRole}
          onRemove={handleRemoveMember}
        />
      )}

      {showEditBoard && (
        <EditBoardModal
          board={board}
          onClose={() => setShowEditBoard(false)}
          onUpdated={(updated) => {
            setBoard(updated);
            setShowEditBoard(false);
          }}
        />
      )}

      {listModal && (
        <ListFormModal
          list={listModal.list}
          allLists={lists}
          onClose={() => setListModal(null)}
          onSubmit={(input) => handleCreateOrEditList(input, listModal.list)}
        />
      )}

      {deleteListTarget && (
        <DeleteListModal
          list={deleteListTarget}
          cardCount={(cards ?? []).filter((c) => c.listId === deleteListTarget.id).length}
          onClose={() => setDeleteListTarget(null)}
          onConfirm={handleConfirmDeleteList}
        />
      )}

      <div className="flex justify-center gap-3 border-t border-border bg-surface p-3">
        {board.role === "administrador" && (
          <Button type="button" variant="danger" onClick={handleDeleteBoard}>
            Excluir quadro
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleLeaveBoard}>
          Sair do quadro
        </Button>
      </div>
    </div>
  );
}

export default function QuadroPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireAuth>
      <BoardDetail id={params.id} />
    </RequireAuth>
  );
}
