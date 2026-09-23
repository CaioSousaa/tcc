"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpDown,
  ListFilter,
  Pencil,
  Plus,
  Tag,
  Users,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { ListColumn } from "@/components/ListColumn";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteListDialog } from "@/components/DeleteListDialog";
import { CardDetailModal } from "@/components/CardDetailModal";
import { BoardMembersModal } from "@/components/BoardMembersModal";
import { BoardFormModal } from "@/components/BoardFormModal";
import { LabelsModal } from "@/components/LabelsModal";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/avatar";
import { Board, BOARD_COLOR_CLASSES, BoardColor } from "@/lib/board-colors";
import { BoardMember } from "@/lib/board-members";
import { List } from "@/lib/lists";
import { Card } from "@/lib/cards";
import { Label, LABEL_COLOR_CLASSES } from "@/lib/labels";

function BoardDetailContent() {
  const params = useParams<{ id: string }>();
  const boardId = params.id;
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cardsByList, setCardsByList] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingList, setDeletingList] = useState<List | null>(null);
  const [deletingListBusy, setDeletingListBusy] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);
  const [deletingCardBusy, setDeletingCardBusy] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showLabelsModal, setShowLabelsModal] = useState(false);
  const [showBoardEditModal, setShowBoardEditModal] = useState(false);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [boardLabels, setBoardLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [sortByDueDate, setSortByDueDate] = useState(false);

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  async function loadBoard() {
    setLoading(true);
    try {
      const [boardResponse, listsResponse, labelsResponse, membersResponse] = await Promise.all([
        api.get(`/boards/${boardId}`),
        api.get(`/boards/${boardId}/lists`),
        api.get(`/boards/${boardId}/labels`),
        api.get(`/boards/${boardId}/members`),
      ]);
      setBoard(boardResponse.data);
      setBoardLabels(labelsResponse.data);
      setMembers(membersResponse.data);
      const fetchedLists: List[] = listsResponse.data;
      setLists(fetchedLists);

      await loadCards(fetchedLists, sortByDueDate);
    } catch {
      router.replace("/quadros");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateBoard(name: string, color: BoardColor) {
    const response = await api.patch(`/boards/${boardId}`, { name, color });
    setBoard(response.data);
    setShowBoardEditModal(false);
  }

  async function loadCards(targetLists: List[], sortByDue: boolean) {
    const cardsResponses = await Promise.all(
      targetLists.map((list) =>
        api.get(`/boards/${boardId}/lists/${list.id}/cards`, {
          params: sortByDue ? { sortBy: "dueDate" } : undefined,
        })
      )
    );
    const cardsMap: Record<string, Card[]> = {};
    targetLists.forEach((list, index) => {
      cardsMap[list.id] = cardsResponses[index]?.data ?? [];
    });
    setCardsByList(cardsMap);
  }

  function toggleSortByDueDate() {
    const next = !sortByDueDate;
    setSortByDueDate(next);
    loadCards(lists, next);
  }

  async function handleCreateList(event: FormEvent) {
    event.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post(`/boards/${boardId}/lists`, {
        name: newListName.trim(),
      });
      setLists((prev) => [...prev, response.data]);
      setCardsByList((prev) => ({ ...prev, [response.data.id]: [] }));
      setNewListName("");
      setShowAddForm(false);
    } finally {
      setCreating(false);
    }
  }

  async function handleRenameList(listId: string, name: string) {
    const response = await api.patch(`/boards/${boardId}/lists/${listId}`, { name });
    setLists((prev) => prev.map((l) => (l.id === listId ? response.data : l)));
  }

  async function handleDeleteList(strategy?: "move" | "delete", destinationListId?: string) {
    if (!deletingList) return;
    setDeletingListBusy(true);
    try {
      await api.delete(`/boards/${boardId}/lists/${deletingList.id}`, {
        data: strategy ? { strategy, destinationListId } : undefined,
      });

      const movedCards = cardsByList[deletingList.id] ?? [];
      setLists((prev) => prev.filter((l) => l.id !== deletingList.id));
      setCardsByList((prev) => {
        const next = { ...prev };
        delete next[deletingList.id];
        if (strategy === "move" && destinationListId) {
          next[destinationListId] = [...(next[destinationListId] ?? []), ...movedCards];
        }
        return next;
      });
      setDeletingList(null);
    } finally {
      setDeletingListBusy(false);
    }
  }

  async function handleReorderLists(reordered: List[]) {
    setLists(reordered);
    const response = await api.patch(`/boards/${boardId}/lists/reorder`, {
      orderedIds: reordered.map((l) => l.id),
    });
    setLists(response.data);
  }

  async function moveListToPosition(listId: string, position: number) {
    const index = lists.findIndex((l) => l.id === listId);
    if (index === -1) return;
    const target = Math.max(0, Math.min(position, lists.length - 1));
    if (target === index) return;
    const reordered = [...lists];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved as List);
    await handleReorderLists(reordered);
  }

  async function handleAddCard(listId: string, title: string) {
    const response = await api.post(`/boards/${boardId}/lists/${listId}/cards`, { title });
    setCardsByList((prev) => ({
      ...prev,
      [listId]: [...(prev[listId] ?? []), response.data],
    }));
  }

  function moveCardVertically(listId: string, index: number, direction: -1 | 1) {
    const listCards = cardsByList[listId] ?? [];
    const target = index + direction;
    if (target < 0 || target >= listCards.length) return;

    const reordered = [...listCards];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved as Card);
    setCardsByList((prev) => ({ ...prev, [listId]: reordered }));

    api.patch(`/boards/${boardId}/cards/${(moved as Card).id}/move`, {
      listId,
      position: target,
    });
  }

  async function handleSaveCard(
    title: string,
    description: string | null,
    listId: string,
    dueDate: string | null
  ) {
    if (!selectedCard) return;

    const originalListId = selectedCard.listId;
    let updatedCard: Card = selectedCard;

    if (
      title !== selectedCard.title ||
      description !== selectedCard.description ||
      dueDate !== (selectedCard.dueDate ? selectedCard.dueDate.slice(0, 10) : null)
    ) {
      const response = await api.patch(`/boards/${boardId}/cards/${selectedCard.id}`, {
        title,
        description,
        dueDate,
      });
      updatedCard = { ...updatedCard, ...response.data };
    }

    if (listId !== originalListId) {
      const destinationCount = (cardsByList[listId] ?? []).length;
      const response = await api.patch(`/boards/${boardId}/cards/${selectedCard.id}/move`, {
        listId,
        position: destinationCount,
      });
      updatedCard = { ...updatedCard, ...response.data };

      setCardsByList((prev) => ({
        ...prev,
        [originalListId]: (prev[originalListId] ?? []).filter((c) => c.id !== selectedCard.id),
        [listId]: [...(prev[listId] ?? []), updatedCard],
      }));
    } else {
      setCardsByList((prev) => ({
        ...prev,
        [originalListId]: (prev[originalListId] ?? []).map((c) =>
          c.id === selectedCard.id ? updatedCard : c
        ),
      }));
    }

    setSelectedCard(null);
  }

  function handleCardLabelsChange(card: Card, labels: Label[]) {
    setCardsByList((prev) => ({
      ...prev,
      [card.listId]: (prev[card.listId] ?? []).map((c) =>
        c.id === card.id ? { ...c, labels } : c
      ),
    }));
  }

  function handleCardChecklistChange(card: Card, done: number, total: number) {
    setCardsByList((prev) => ({
      ...prev,
      [card.listId]: (prev[card.listId] ?? []).map((c) =>
        c.id === card.id ? { ...c, checklist: { done, total } } : c
      ),
    }));
  }

  function toggleLabelFilter(labelId: string) {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  }

  function visibleCards(listId: string): Card[] {
    const listCards = cardsByList[listId] ?? [];
    if (selectedLabelIds.size === 0) return listCards;
    return listCards.filter((card) =>
      card.labels?.some((label) => selectedLabelIds.has(label.id))
    );
  }

  async function handleDeleteCard() {
    if (!deletingCard) return;
    setDeletingCardBusy(true);
    try {
      await api.delete(`/boards/${boardId}/cards/${deletingCard.id}`);
      setCardsByList((prev) => ({
        ...prev,
        [deletingCard.listId]: (prev[deletingCard.listId] ?? []).filter(
          (c) => c.id !== deletingCard.id
        ),
      }));
      setDeletingCard(null);
      setSelectedCard(null);
    } finally {
      setDeletingCardBusy(false);
    }
  }

  if (loading || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-8 py-4">
        <Link
          href="/quadros"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quadros
        </Link>
        <div className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-full ${BOARD_COLOR_CLASSES[board.color]}`} />
          <h1 className="text-lg font-bold text-slate-900">{board.name}</h1>
          <button
            onClick={() => setShowBoardEditModal(true)}
            aria-label="Editar quadro"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowLabelsModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Tag className="h-4 w-4" />
            Etiquetas
          </button>
          <button
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <Users className="h-4 w-4" />
            Membros
          </button>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <span
                key={member.id}
                title={member.user.name}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#1c3557] text-xs font-semibold text-white"
              >
                {getInitials(member.user.name)}
              </span>
            ))}
          </div>
        </div>
      </header>

      {(boardLabels.length > 0 || lists.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-8 py-3">
          {boardLabels.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <ListFilter className="h-4 w-4" />
                Filtrar por etiqueta
              </span>
              <button
                onClick={() => setSelectedLabelIds(new Set())}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedLabelIds.size === 0
                    ? "bg-[#1c3557] text-white"
                    : "bg-zinc-100 text-slate-600 hover:bg-zinc-200"
                }`}
              >
                Todas
              </button>
              {boardLabels.map((label) => (
                <button
                  key={label.id}
                  onClick={() => toggleLabelFilter(label.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                    selectedLabelIds.has(label.id)
                      ? "bg-[#1c3557] text-white"
                      : "bg-zinc-100 text-slate-600 hover:bg-zinc-200"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${LABEL_COLOR_CLASSES[label.color]}`} />
                  {label.name}
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {Object.values(cardsByList).reduce((sum, c) => sum + c.length, 0)} cards no quadro
            </span>
            <button
              onClick={toggleSortByDueDate}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                sortByDueDate
                  ? "bg-[#1c3557] text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              Ordenar por prazo
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-auto px-8 py-6">
        <div className="flex items-start gap-4">
          {lists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              lists={lists}
              cards={visibleCards(list.id)}
              onRename={(name) => handleRenameList(list.id, name)}
              onReorder={(position) => moveListToPosition(list.id, position)}
              onDelete={() => setDeletingList(list)}
              onAddCard={(title) => handleAddCard(list.id, title)}
              onOpenCard={(card) => setSelectedCard(card)}
              onMoveCardUp={(_card, cardIndex) => moveCardVertically(list.id, cardIndex, -1)}
              onMoveCardDown={(_card, cardIndex) => moveCardVertically(list.id, cardIndex, 1)}
            />
          ))}

          <div className="w-72 shrink-0">
            {showAddForm ? (
              <form onSubmit={handleCreateList} className="rounded-lg bg-zinc-100 p-3">
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Nome da lista"
                  className="mb-2 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-md bg-[#1c3557] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#162a46] disabled:opacity-60"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewListName("");
                    }}
                    className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-zinc-200"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-3 text-left text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700"
              >
                <Plus className="h-4 w-4" />
                Adicionar lista
              </button>
            )}
          </div>
        </div>
      </main>

      {deletingList && (cardsByList[deletingList.id]?.length ?? 0) === 0 && (
        <ConfirmDialog
          title={`Excluir a lista "${deletingList.name}"?`}
          description="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          submitting={deletingListBusy}
          onConfirm={() => handleDeleteList()}
          onCancel={() => setDeletingList(null)}
        />
      )}

      {deletingList && (cardsByList[deletingList.id]?.length ?? 0) > 0 && (
        <DeleteListDialog
          list={deletingList}
          cardCount={cardsByList[deletingList.id]?.length ?? 0}
          otherLists={lists.filter((l) => l.id !== deletingList.id)}
          submitting={deletingListBusy}
          onConfirm={(strategy, destinationListId) => handleDeleteList(strategy, destinationListId)}
          onCancel={() => setDeletingList(null)}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          boardId={boardId}
          card={selectedCard}
          lists={lists}
          onSave={handleSaveCard}
          onDelete={() => setDeletingCard(selectedCard)}
          onClose={() => setSelectedCard(null)}
          onLabelsChange={(labels) => handleCardLabelsChange(selectedCard, labels)}
          onLabelCreated={(label) => setBoardLabels((prev) => [...prev, label])}
          onChecklistChange={(done, total) => handleCardChecklistChange(selectedCard, done, total)}
        />
      )}

      {deletingCard && (
        <ConfirmDialog
          title={`Excluir o card "${deletingCard.title}"?`}
          description="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          submitting={deletingCardBusy}
          onConfirm={handleDeleteCard}
          onCancel={() => setDeletingCard(null)}
        />
      )}

      {showMembersModal && (
        <BoardMembersModal boardId={boardId} onClose={() => setShowMembersModal(false)} />
      )}

      {showLabelsModal && (
        <LabelsModal
          boardId={boardId}
          onLabelCreated={(label) => setBoardLabels((prev) => [...prev, label])}
          onLabelDeleted={(labelId) =>
            setBoardLabels((prev) => prev.filter((l) => l.id !== labelId))
          }
          onClose={() => setShowLabelsModal(false)}
        />
      )}

      {showBoardEditModal && (
        <BoardFormModal
          title="Editar quadro"
          confirmLabel="Salvar"
          initialName={board.name}
          initialColor={board.color}
          onSubmit={handleUpdateBoard}
          onClose={() => setShowBoardEditModal(false)}
        />
      )}
    </div>
  );
}

export default function BoardDetailPage() {
  return (
    <RequireAuth>
      <BoardDetailContent />
    </RequireAuth>
  );
}
