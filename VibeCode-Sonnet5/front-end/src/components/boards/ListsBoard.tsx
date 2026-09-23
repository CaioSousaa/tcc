"use client";

import { DragEvent, useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card, deleteCard, fetchCards, updateCard } from "@/lib/cards";
import { LABEL_DOT_CLASSES } from "@/lib/label-colors";
import { Label, fetchLabels } from "@/lib/labels";
import { BoardList, deleteList, fetchLists, reorderLists } from "@/lib/lists";
import { CardItem } from "./CardItem";
import { CardModal } from "./CardModal";
import { DeleteListDialog } from "./DeleteListDialog";
import { ListColumn } from "./ListColumn";
import { ListModal } from "./ListModal";

export function ListsBoard({
  boardId,
  canManageLists,
  labelsRefreshKey,
}: {
  boardId: string;
  canManageLists: boolean;
  labelsRefreshKey?: number;
}) {
  const [lists, setLists] = useState<BoardList[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const [listToDelete, setListToDelete] = useState<BoardList | null>(null);
  const [listModalTarget, setListModalTarget] = useState<
    BoardList | "create" | null
  >(null);

  const [cardModalState, setCardModalState] = useState<
    { card: Card | null; listId: string } | null
  >(null);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);

  const handleChecklistProgressChange = useCallback(
    (total: number, completed: number) => {
      const cardId = cardModalState?.card?.id;
      if (!cardId) return;
      setCards((prev) =>
        prev.map((item) =>
          item.id === cardId &&
          (item.checklistTotal !== total || item.checklistCompleted !== completed)
            ? { ...item, checklistTotal: total, checklistCompleted: completed }
            : item,
        ),
      );
    },
    [cardModalState],
  );

  const handleLabelsChange = useCallback(
    (updatedLabels: Card["labels"]) => {
      const cardId = cardModalState?.card?.id;
      if (!cardId) return;
      setCards((prev) =>
        prev.map((item) =>
          item.id === cardId ? { ...item, labels: updatedLabels } : item,
        ),
      );
    },
    [cardModalState],
  );

  const loadBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listsResult, cardsResult, labelsResult] = await Promise.all([
        fetchLists(boardId),
        fetchCards(boardId),
        fetchLabels(boardId),
      ]);
      setLists(listsResult);
      setCards(cardsResult);
      setLabels(labelsResult);
    } catch {
      setError("Não foi possível carregar o quadro.");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const reloadLabels = useCallback(async () => {
    try {
      setLabels(await fetchLabels(boardId));
    } catch {
      setError("Não foi possível atualizar as etiquetas.");
    }
  }, [boardId]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  useEffect(() => {
    if (labelsRefreshKey) reloadLabels();
  }, [labelsRefreshKey, reloadLabels]);

  function handleListDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function handleListDrop(targetId: string) {
    if (!canManageLists || !draggedListId || draggedListId === targetId) return;

    const current = [...lists];
    const fromIndex = current.findIndex((item) => item.id === draggedListId);
    const toIndex = current.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);

    setLists(current);
    try {
      await reorderLists(boardId, current.map((item) => item.id));
    } catch {
      setError("Não foi possível reordenar as listas.");
      loadBoardData();
    }
  }

  async function moveCard(targetListId: string, targetIndex: number) {
    if (!draggedCardId) return;
    const cardId = draggedCardId;
    setDraggedCardId(null);

    try {
      await updateCard(boardId, cardId, {
        listId: targetListId,
        position: targetIndex,
      });
    } catch {
      setError("Não foi possível mover o card.");
    } finally {
      await loadBoardData();
    }
  }

  if (loading) {
    return (
      <p className="px-8 py-10 text-sm text-zinc-500 dark:text-zinc-400">
        Carregando quadro...
      </p>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-x-auto px-8 py-6">
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {labels.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Filtrar por etiqueta:
          </span>
          <button
            type="button"
            onClick={() => setActiveLabelId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeLabelId === null
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            Todas
          </button>
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              onClick={() =>
                setActiveLabelId((prev) => (prev === label.id ? null : label.id))
              }
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                activeLabelId === label.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${LABEL_DOT_CLASSES[label.color]}`}
              />
              {label.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 items-start gap-4">
        {lists.map((list) => {
          const listCards = cards
            .filter(
              (card) =>
                card.listId === list.id &&
                (!activeLabelId ||
                  card.labels.some((label) => label.id === activeLabelId)),
            )
            .sort((a, b) => a.position - b.position);

          return (
            <ListColumn
              key={list.id}
              list={list}
              isDragging={draggedListId === list.id}
              canManage={canManageLists}
              onDragStart={() => setDraggedListId(list.id)}
              onDragOver={handleListDragOver}
              onDrop={() => handleListDrop(list.id)}
              onDragEnd={() => setDraggedListId(null)}
              onCardDropToEnd={() => moveCard(list.id, listCards.length)}
              onEdit={() => setListModalTarget(list)}
              onDelete={() => setListToDelete(list)}
            >
              {listCards.map((card, index) => (
                <CardItem
                  key={card.id}
                  card={card}
                  isDragging={draggedCardId === card.id}
                  onOpen={() => setCardModalState({ card, listId: list.id })}
                  onDragStart={() => setDraggedCardId(card.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveCard(list.id, index)}
                  onDragEnd={() => setDraggedCardId(null)}
                />
              ))}

              <button
                type="button"
                onClick={() => setCardModalState({ card: null, listId: list.id })}
                className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-left text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              >
                + Adicionar card
              </button>
            </ListColumn>
          );
        })}

        {canManageLists && (
          <button
            type="button"
            onClick={() => setListModalTarget("create")}
            className="w-72 shrink-0 rounded-xl border-2 border-dashed border-zinc-300 px-3 py-2.5 text-left text-sm font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
          >
            + Adicionar lista
          </button>
        )}
      </div>

      {listModalTarget && (
        <ListModal
          boardId={boardId}
          lists={lists}
          target={listModalTarget}
          onClose={() => setListModalTarget(null)}
          onSaved={async () => {
            setListModalTarget(null);
            await loadBoardData();
          }}
        />
      )}

      {listToDelete && (
        <DeleteListDialog
          list={listToDelete}
          cardCount={
            cards.filter((card) => card.listId === listToDelete.id).length
          }
          otherLists={lists.filter((item) => item.id !== listToDelete.id)}
          onClose={() => setListToDelete(null)}
          onConfirm={async (strategy, targetListId) => {
            await deleteList(boardId, listToDelete.id, {
              strategy,
              targetListId,
            });
            setListToDelete(null);
            await loadBoardData();
          }}
        />
      )}

      {cardModalState && (
        <CardModal
          boardId={boardId}
          lists={lists}
          card={cardModalState.card}
          initialListId={cardModalState.listId}
          canManageLabels={canManageLists}
          onClose={() => setCardModalState(null)}
          onSaved={async () => {
            setCardModalState(null);
            await loadBoardData();
          }}
          onRequestDelete={(card) => {
            setCardModalState(null);
            setCardToDelete(card);
          }}
          onChecklistProgressChange={handleChecklistProgressChange}
          onLabelsChange={handleLabelsChange}
          onLabelCatalogChange={reloadLabels}
        />
      )}

      {cardToDelete && (
        <ConfirmDialog
          title={`Excluir o card "${cardToDelete.title}"?`}
          description="Esta ação é irreversível."
          onClose={() => setCardToDelete(null)}
          onConfirm={async () => {
            await deleteCard(boardId, cardToDelete.id);
            setCardToDelete(null);
            await loadBoardData();
          }}
        />
      )}
    </div>
  );
}
