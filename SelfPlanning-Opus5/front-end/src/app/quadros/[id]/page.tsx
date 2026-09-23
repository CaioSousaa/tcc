"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { BoardLabelsModal } from "@/components/BoardLabelsModal";
import { BoardMembersModal } from "@/components/BoardMembersModal";
import { BoardColumn } from "@/components/BoardColumn";
import { CardDetailModal } from "@/components/CardDetailModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DeleteListModal } from "@/components/DeleteListModal";
import { FormMessage } from "@/components/FormMessage";
import { ListFormModal } from "@/components/ListFormModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { BOARD_COLOR_HEX } from "@/lib/boardColors";
import { Board, showBoardRequest } from "@/lib/boardsApi";
import {
  Card,
  CardPayload,
  CardsByList,
  createCardRequest,
  deleteCardRequest,
  listCardsRequest,
  moveCardRequest,
  updateCardRequest,
} from "@/lib/cardsApi";
import {
  BoardList,
  DeleteListOptions,
  createListRequest,
  deleteListRequest,
  listListsRequest,
  moveListRequest,
  renameListRequest,
} from "@/lib/listsApi";
import { BoardMember, CardAssignee, listMembersRequest } from "@/lib/membersApi";
import { LABEL_COLOR_HEX } from "@/lib/labelColors";
import { Label, LabelWithCount, listLabelsRequest } from "@/lib/labelsApi";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/lib/errors";

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id;
  const { isChecking } = useRequireAuth();
  const { user } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<BoardList[]>([]);
  const [cardsByList, setCardsByList] = useState<CardsByList>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [listUnderEdit, setListUnderEdit] = useState<BoardList | null>(null);
  const [listUnderDeletion, setListUnderDeletion] = useState<BoardList | null>(null);
  const [listForNewCard, setListForNewCard] = useState<BoardList | null>(null);
  const [cardUnderEdit, setCardUnderEdit] = useState<Card | null>(null);
  const [cardUnderDeletion, setCardUnderDeletion] = useState<Card | null>(null);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [labels, setLabels] = useState<LabelWithCount[]>([]);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [cardForLabels, setCardForLabels] = useState<Card | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [sortByDueDate, setSortByDueDate] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [draggedList, setDraggedList] = useState<BoardList | null>(null);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (isChecking || !boardId) {
      return;
    }

    let active = true;

    Promise.all([
      showBoardRequest(boardId),
      listListsRequest(boardId),
      listCardsRequest(boardId),
      listMembersRequest(boardId),
      listLabelsRequest(boardId),
    ])
      .then(([loadedBoard, loadedLists, loadedCards, loadedMembers, loadedLabels]) => {
        if (active) {
          setBoard(loadedBoard);
          setLists(loadedLists);
          setCardsByList(loadedCards);
          setMembers(loadedMembers);
          setLabels(loadedLabels);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getErrorMessage(error, "Não foi possível carregar o quadro."));
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
  }, [boardId, isChecking]);

  useEffect(() => {
    if (isChecking || !boardId || isLoading) {
      return;
    }

    let active = true;

    listCardsRequest(boardId, {
      labelIds: labelFilter === null ? [] : [labelFilter],
      sortByDueDate,
      overdueOnly,
    })
      .then((filtered) => {
        if (active) {
          setCardsByList(filtered);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getErrorMessage(error, "Não foi possível filtrar os cards."));
        }
      });

    return () => {
      active = false;
    };
  }, [boardId, isChecking, isLoading, labelFilter, overdueOnly, sortByDueDate]);

  function handleCardLabelsChange(cardId: string, cardLabels: Label[]): void {
    setCardsByList((current) => {
      const updated: CardsByList = {};

      for (const [listId, cards] of Object.entries(current)) {
        updated[listId] = cards.map((item) =>
          item.id === cardId ? { ...item, labels: cardLabels } : item
        );
      }

      return updated;
    });

    setCardForLabels((current) =>
      current && current.id === cardId ? { ...current, labels: cardLabels } : current
    );

    setCardUnderEdit((current) =>
      current && current.id === cardId ? { ...current, labels: cardLabels } : current
    );
  }

  async function handleCreateList({
    name,
    position,
  }: {
    name: string;
    position: number;
  }): Promise<void> {
    const created = await createListRequest(boardId, name);

    if (position === created.position) {
      setLists((current) => [...current, created]);
    } else {
      setLists(await moveListRequest(boardId, created.id, position));
    }

    setCardsByList((current) => ({ ...current, [created.id]: [] }));
    setIsCreatingList(false);
  }

  async function handleEditList(
    list: BoardList,
    { name, position }: { name: string; position: number }
  ): Promise<void> {
    const renamed = await renameListRequest(boardId, list.id, name);

    if (position === list.position) {
      setLists((current) => current.map((item) => (item.id === renamed.id ? renamed : item)));
    } else {
      setLists(await moveListRequest(boardId, list.id, position));
    }

    setListUnderEdit(null);
  }

  async function handleDeleteList(
    list: BoardList,
    options: DeleteListOptions
  ): Promise<void> {
    const result = await deleteListRequest(boardId, list.id, options);

    setLists(result.lists);
    setCardsByList(result.cards);
    setListUnderDeletion(null);
  }

  async function handleDropListOn(target: BoardList): Promise<void> {
    const dragged = draggedList;

    setDraggedList(null);

    if (!dragged || dragged.id === target.id) {
      return;
    }

    try {
      setLists(await moveListRequest(boardId, dragged.id, target.position));
    } catch (error) {
      setLoadError(getErrorMessage(error, "Não foi possível reordenar as listas."));
    }
  }

  async function handleCreateCard(data: CardPayload & { listId: string }): Promise<void> {
    const created = await createCardRequest(boardId, data.listId, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
    });

    setCardsByList((current) => ({
      ...current,
      [created.listId]: [...(current[created.listId] ?? []), created],
    }));
    setListForNewCard(null);
  }

  async function handleUpdateCard(
    card: Card,
    data: CardPayload & { listId: string }
  ): Promise<void> {
    const updated = await updateCardRequest(boardId, card.id, {
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
    });

    if (data.listId !== card.listId) {
      setCardsByList(
        await moveCardRequest(boardId, card.id, data.listId, cardsByList[data.listId]?.length ?? 0)
      );
    } else {
      setCardsByList((current) => ({
        ...current,
        [card.listId]: (current[card.listId] ?? []).map((item) =>
          item.id === updated.id ? updated : item
        ),
      }));
    }

    setCardUnderEdit(null);
  }

  function handleCommentCountChange(cardId: string, count: number): void {
    setCardsByList((current) => {
      const updated: CardsByList = {};

      for (const [listId, cards] of Object.entries(current)) {
        updated[listId] = cards.map((item) =>
          item.id === cardId ? { ...item, commentCount: count } : item
        );
      }

      return updated;
    });

    setCardUnderEdit((current) =>
      current && current.id === cardId ? { ...current, commentCount: count } : current
    );
  }

  function handleAssigneesChange(cardId: string, assignees: CardAssignee[]): void {
    setCardsByList((current) => {
      const updated: CardsByList = {};

      for (const [listId, cards] of Object.entries(current)) {
        updated[listId] = cards.map((item) =>
          item.id === cardId ? { ...item, assignees } : item
        );
      }

      return updated;
    });

    setCardUnderEdit((current) =>
      current && current.id === cardId ? { ...current, assignees } : current
    );
  }

  function handleChecklistProgressChange(cardId: string, total: number, done: number): void {
    setCardsByList((current) => {
      const updated: CardsByList = {};

      for (const [listId, cards] of Object.entries(current)) {
        updated[listId] = cards.map((item) =>
          item.id === cardId ? { ...item, checklistTotal: total, checklistDone: done } : item
        );
      }

      return updated;
    });

    setCardUnderEdit((current) =>
      current && current.id === cardId
        ? { ...current, checklistTotal: total, checklistDone: done }
        : current
    );
  }

  async function handleDeleteCard(card: Card): Promise<void> {
    setCardsByList(await deleteCardRequest(boardId, card.id));
    setCardUnderDeletion(null);
  }

  async function moveDraggedCard(listId: string, position: number): Promise<void> {
    const dragged = draggedCard;

    setDraggedCard(null);

    if (!dragged) {
      return;
    }

    if (dragged.listId === listId && dragged.position === position) {
      return;
    }

    try {
      setCardsByList(await moveCardRequest(boardId, dragged.id, listId, position));
    } catch (error) {
      setLoadError(getErrorMessage(error, "Não foi possível mover o card."));
    }
  }

  const isAdmin = board?.role === "admin";
  const visibleCardCount = Object.values(cardsByList).reduce(
    (total, cards) => total + cards.length,
    0
  );

  if (isChecking) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader />

      <div className="flex flex-wrap items-center gap-4 border-b border-border bg-surface px-6 py-3">
        <Link href="/quadros" className="text-sm text-muted transition-colors hover:text-foreground">
          ‹ Quadros
        </Link>

        {board ? (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="h-4 w-4 rounded"
              style={{ backgroundColor: BOARD_COLOR_HEX[board.color] }}
            />
            <h1 className="text-lg font-bold text-foreground">{board.name}</h1>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar
                key={member.id}
                name={member.name}
                email={member.email}
                size="sm"
                muted={member.status === "pending"}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsLabelsOpen(true)}
            className="h-9 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-background"
          >
            Etiquetas
          </button>

          <button
            type="button"
            onClick={() => setIsMembersOpen(true)}
            className="h-9 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-background"
          >
            Membros
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-6 py-2.5">
        <span className="text-sm text-muted">Filtrar por etiqueta</span>

        <button
          type="button"
          onClick={() => setLabelFilter(null)}
          className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
            labelFilter === null
              ? "bg-brand text-white"
              : "border border-border text-foreground hover:bg-background"
          }`}
        >
          Todas
        </button>

        {labels.map((label) => (
          <button
            key={label.id}
            type="button"
            onClick={() => setLabelFilter(label.id)}
            className={`flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors ${
              labelFilter === label.id
                ? "bg-brand text-white"
                : "border border-border text-foreground hover:bg-background"
            }`}
          >
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: LABEL_COLOR_HEX[label.color] }}
            />
            {label.name}
          </button>
        ))}

        <span className="ml-auto text-xs text-muted">
          {visibleCardCount} {visibleCardCount === 1 ? "card no quadro" : "cards no quadro"}
        </span>

        <button
          type="button"
          onClick={() => setOverdueOnly((current) => !current)}
          className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
            overdueOnly
              ? "bg-red-700 text-white"
              : "border border-border text-foreground hover:bg-background"
          }`}
        >
          Somente atrasados
        </button>

        <button
          type="button"
          onClick={() => setSortByDueDate((current) => !current)}
          className={`h-8 rounded-full px-3 text-xs font-medium transition-colors ${
            sortByDueDate
              ? "bg-brand text-white"
              : "border border-border text-foreground hover:bg-background"
          }`}
        >
          Ordenar por prazo
        </button>
      </div>

      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        {loadError ? <FormMessage message={loadError} /> : null}

        {isLoading ? (
          <p className="text-sm text-muted">Carregando quadro...</p>
        ) : (
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {lists.map((list) => (
              <BoardColumn
                key={list.id}
                list={list}
                cards={cardsByList[list.id] ?? []}
                isDragging={draggedList?.id === list.id}
                draggedCardId={draggedCard?.id ?? null}
                canManageLists={isAdmin}
                onEdit={setListUnderEdit}
                onDelete={setListUnderDeletion}
                onDragStart={setDraggedList}
                onDragEnd={() => setDraggedList(null)}
                onDropOn={(target) => void handleDropListOn(target)}
                onAddCard={setListForNewCard}
                onOpenCard={setCardUnderEdit}
                onCardDragStart={setDraggedCard}
                onCardDragEnd={() => setDraggedCard(null)}
                onCardDropOnCard={(target) => void moveDraggedCard(target.listId, target.position)}
                onCardDropOnList={(target) =>
                  void moveDraggedCard(target.id, cardsByList[target.id]?.length ?? 0)
                }
              />
            ))}

            {isAdmin ? (
              <button
                type="button"
                onClick={() => setIsCreatingList(true)}
                className="flex w-72 shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted transition-colors hover:border-brand hover:text-foreground"
              >
                + Adicionar lista
              </button>
            ) : null}
          </div>
        )}
      </main>

      {isCreatingList ? (
        <ListFormModal
          lists={lists}
          onClose={() => setIsCreatingList(false)}
          onSubmit={handleCreateList}
        />
      ) : null}

      {listUnderEdit ? (
        <ListFormModal
          list={listUnderEdit}
          lists={lists}
          onClose={() => setListUnderEdit(null)}
          onSubmit={(data) => handleEditList(listUnderEdit, data)}
        />
      ) : null}

      {listUnderDeletion ? (
        <DeleteListModal
          list={listUnderDeletion}
          lists={lists}
          cardCount={cardsByList[listUnderDeletion.id]?.length ?? 0}
          blockListDeletionWithCards={board?.blockListDeletionWithCards ?? false}
          onClose={() => setListUnderDeletion(null)}
          onConfirm={(options) => handleDeleteList(listUnderDeletion, options)}
        />
      ) : null}

      {listForNewCard ? (
        <CardDetailModal
          boardId={boardId}
          listId={listForNewCard.id}
          lists={lists}
          members={members}
          onClose={() => setListForNewCard(null)}
          onSubmit={handleCreateCard}
        />
      ) : null}

      {cardUnderEdit ? (
        <CardDetailModal
          card={cardUnderEdit}
          boardId={boardId}
          listId={cardUnderEdit.listId}
          lists={lists}
          members={members}
          onChecklistProgressChange={handleChecklistProgressChange}
          onAssigneesChange={handleAssigneesChange}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          onCommentCountChange={handleCommentCountChange}
          onManageLabels={(card) => {
            setCardUnderEdit(null);
            setCardForLabels(card);
          }}
          onClose={() => setCardUnderEdit(null)}
          onSubmit={(data) => handleUpdateCard(cardUnderEdit, data)}
          onRequestDelete={(card) => {
            setCardUnderEdit(null);
            setCardUnderDeletion(card);
          }}
        />
      ) : null}

      {isLabelsOpen || cardForLabels ? (
        <BoardLabelsModal
          boardId={boardId}
          labels={labels}
          isAdmin={isAdmin}
          {...(cardForLabels
            ? {
                cardId: cardForLabels.id,
                cardLabels: cardForLabels.labels,
                onCardLabelsChange: handleCardLabelsChange,
              }
            : {})}
          onClose={() => {
            setIsLabelsOpen(false);
            setCardForLabels(null);
          }}
          onLabelsChange={setLabels}
        />
      ) : null}

      {isMembersOpen ? (
        <BoardMembersModal
          boardId={boardId}
          members={members}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
          onClose={() => setIsMembersOpen(false)}
          onMembersChange={setMembers}
        />
      ) : null}

      {cardUnderDeletion ? (
        <ConfirmDialog
          title={`Excluir o card "${cardUnderDeletion.title}"?`}
          description="Ação irreversível: o card e todo o conteúdo dele serão apagados definitivamente."
          confirmLabel="Excluir card"
          errorFallback="Não foi possível excluir o card."
          onClose={() => setCardUnderDeletion(null)}
          onConfirm={() => handleDeleteCard(cardUnderDeletion)}
        />
      ) : null}
    </div>
  );
}
