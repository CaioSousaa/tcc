"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { BoardFormModal } from "@/components/boards/BoardFormModal";
import { CardFormModal } from "@/components/cards/CardFormModal";
import { DeleteCardModal } from "@/components/cards/DeleteCardModal";
import { BackIcon, MembersIcon, PencilIcon, PlusIcon, TagIcon } from "@/components/icons";
import { LabelFilterBar } from "@/components/labels/LabelFilterBar";
import { LabelsModal } from "@/components/labels/LabelsModal";
import { DeleteListModal } from "@/components/lists/DeleteListModal";
import { ListColumn } from "@/components/lists/ListColumn";
import { ListFormModal } from "@/components/lists/ListFormModal";
import { MembersModal } from "@/components/members/MembersModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  inviteBoardMember,
  listBoardMembers,
  removeBoardMember,
  updateBoardMemberRole,
  type BoardMember,
  type BoardMemberRole,
  type InviteBoardMemberInput,
} from "@/lib/board-members";
import {
  BOARD_COLOR_HEX,
  getBoard,
  updateBoard,
  type Board,
  type BoardInput,
} from "@/lib/boards";
import {
  assignCard,
  listCardAssignees,
  unassignCard,
  type CardAssignee,
} from "@/lib/card-assignees";
import {
  assignLabel,
  listCardLabels,
  unassignLabel,
  type CardLabel,
} from "@/lib/card-labels";
import {
  createCard,
  deleteCard,
  listCards,
  updateCard,
  type BoardCard,
} from "@/lib/cards";
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklistItems,
  updateChecklistItem,
  type ChecklistItem,
} from "@/lib/checklist-items";
import {
  createComment,
  deleteComment,
  listComments,
  type Comment,
} from "@/lib/comments";
import { parseApiError } from "@/lib/errors";
import {
  createLabel,
  deleteLabel,
  listLabels,
  type Label,
  type LabelInput,
} from "@/lib/labels";
import {
  createList,
  deleteList,
  listLists,
  reorderLists,
  updateList,
  type BoardList,
  type DeleteListInput,
} from "@/lib/lists";

type ModalState =
  | { type: "closed" }
  | { type: "board" }
  | { type: "createList" }
  | { type: "editList"; list: BoardList }
  | { type: "deleteList"; list: BoardList }
  | { type: "createCard"; list: BoardList }
  | { type: "editCard"; card: BoardCard }
  | { type: "deleteCard"; card: BoardCard }
  | { type: "members" }
  | { type: "labels" };

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id;
  const { user } = useAuth();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<BoardList[]>([]);
  const [cards, setCards] = useState<BoardCard[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [cardAssignees, setCardAssignees] = useState<CardAssignee[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [cardLabels, setCardLabels] = useState<CardLabel[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reorderError, setReorderError] = useState("");
  const [cardError, setCardError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "closed" });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [draggingCard, setDraggingCard] = useState<BoardCard | null>(null);
  const [cardDropTargetId, setCardDropTargetId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    Promise.all([
      getBoard(boardId),
      listLists(boardId),
      listCards(boardId),
      listChecklistItems(boardId),
      listBoardMembers(boardId),
      listCardAssignees(boardId),
      listLabels(boardId),
      listCardLabels(boardId),
      listComments(boardId),
    ])
      .then(
        ([
          loadedBoard,
          loadedLists,
          loadedCards,
          loadedChecklistItems,
          loadedMembers,
          loadedCardAssignees,
          loadedLabels,
          loadedCardLabels,
          loadedComments,
        ]) => {
          if (active) {
            setBoard(loadedBoard);
            setLists(loadedLists);
            setCards(loadedCards);
            setChecklistItems(loadedChecklistItems);
            setMembers(loadedMembers);
            setCardAssignees(loadedCardAssignees);
            setLabels(loadedLabels);
            setCardLabels(loadedCardLabels);
            setComments(loadedComments);
          }
        },
      )
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
  }, [boardId]);

  const closeModal = useCallback(() => setModal({ type: "closed" }), []);

  async function handleBoardUpdate(input: BoardInput) {
    setBoard(await updateBoard(boardId, input));
  }

  async function handleCreateList(input: { title: string; position: number }) {
    await createList(boardId, input);
    setLists(await listLists(boardId));
  }

  async function handleUpdateList(
    listId: string,
    input: { title: string; position: number },
  ) {
    await updateList(boardId, listId, input);
    setLists(await listLists(boardId));
  }

  async function handleDeleteList(listId: string, input: DeleteListInput) {
    await deleteList(boardId, listId, input);
    setLists(await listLists(boardId));
    setCards(await listCards(boardId));
    setChecklistItems(await listChecklistItems(boardId));
    setCardAssignees(await listCardAssignees(boardId));
    setCardLabels(await listCardLabels(boardId));
    setComments(await listComments(boardId));
  }

  async function handleCreateCard(
    listId: string,
    input: { title: string; description: string | null; dueDate: string | null },
  ) {
    await createCard(boardId, { listId, ...input });
    setCards(await listCards(boardId));
  }

  async function handleUpdateCard(
    cardId: string,
    input: { title: string; description: string | null; dueDate: string | null },
  ) {
    await updateCard(boardId, cardId, input);
    setCards(await listCards(boardId));
  }

  async function handleDeleteCard(cardId: string) {
    await deleteCard(boardId, cardId);
    setCards(await listCards(boardId));
    setChecklistItems(await listChecklistItems(boardId));
    setCardAssignees(await listCardAssignees(boardId));
    setCardLabels(await listCardLabels(boardId));
    setComments(await listComments(boardId));
  }

  async function handleAddChecklistItem(cardId: string, title: string) {
    await createChecklistItem(boardId, { cardId, title });
    setChecklistItems(await listChecklistItems(boardId));
  }

  async function handleToggleChecklistItem(item: ChecklistItem, done: boolean) {
    await updateChecklistItem(boardId, item.id, { done });
    setChecklistItems(await listChecklistItems(boardId));
  }

  async function handleDeleteChecklistItem(item: ChecklistItem) {
    await deleteChecklistItem(boardId, item.id);
    setChecklistItems(await listChecklistItems(boardId));
  }

  async function handleInviteMember(input: InviteBoardMemberInput) {
    await inviteBoardMember(boardId, input);
    setMembers(await listBoardMembers(boardId));
  }

  async function handleUpdateMemberRole(memberId: string, role: BoardMemberRole) {
    await updateBoardMemberRole(boardId, memberId, role);
    setMembers(await listBoardMembers(boardId));
  }

  async function handleRemoveMember(memberId: string) {
    await removeBoardMember(boardId, memberId);
    setMembers(await listBoardMembers(boardId));
    setCardAssignees(await listCardAssignees(boardId));
  }

  async function handleAssignCard(cardId: string, userId: string) {
    await assignCard(boardId, { cardId, userId });
    setCardAssignees(await listCardAssignees(boardId));
  }

  async function handleUnassignCard(assigneeId: string) {
    await unassignCard(boardId, assigneeId);
    setCardAssignees(await listCardAssignees(boardId));
  }

  async function handleCreateLabel(input: LabelInput) {
    await createLabel(boardId, input);
    setLabels(await listLabels(boardId));
  }

  async function handleDeleteLabel(labelId: string) {
    await deleteLabel(boardId, labelId);
    setLabels(await listLabels(boardId));
    setCardLabels(await listCardLabels(boardId));
    setSelectedLabelIds((current) => current.filter((id) => id !== labelId));
  }

  async function handleAssignLabel(cardId: string, labelId: string) {
    await assignLabel(boardId, { cardId, labelId });
    setCardLabels(await listCardLabels(boardId));
  }

  async function handleUnassignLabel(cardLabelId: string) {
    await unassignLabel(boardId, cardLabelId);
    setCardLabels(await listCardLabels(boardId));
  }

  function toggleLabelFilter(labelId: string) {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId],
    );
  }

  async function handleAddComment(cardId: string, body: string) {
    await createComment(boardId, { cardId, body });
    setComments(await listComments(boardId));
  }

  async function handleDeleteComment(comment: Comment) {
    await deleteComment(boardId, comment.id);
    setComments(await listComments(boardId));
  }

  /** Moves the dragged card to the drop slot, closing the gap it leaves behind. */
  async function handleCardDrop(
    targetListId: string,
    beforeCardId: string | null,
  ) {
    const source = draggingCard;
    setDraggingCard(null);
    setCardDropTargetId(null);

    if (!source) {
      return;
    }

    const previous = cards;
    const byList = new Map<string, BoardCard[]>();

    for (const card of previous) {
      if (card.id === source.id) {
        continue;
      }

      const list = byList.get(card.listId) ?? [];
      list.push(card);
      byList.set(card.listId, list);
    }

    for (const list of byList.values()) {
      list.sort((a, b) => a.position - b.position);
    }

    const targetList = byList.get(targetListId) ?? [];
    const beforeIndex = beforeCardId
      ? targetList.findIndex((item) => item.id === beforeCardId)
      : -1;
    const insertIndex = beforeIndex < 0 ? targetList.length : beforeIndex;

    if (targetListId === source.listId && insertIndex === source.position) {
      return;
    }

    targetList.splice(insertIndex, 0, { ...source, listId: targetListId });
    byList.set(targetListId, targetList);

    const reindexed: BoardCard[] = [];
    for (const [listId, list] of byList) {
      list.forEach((card, index) => {
        reindexed.push({ ...card, listId, position: index });
      });
    }

    setCards(reindexed);
    setCardError("");

    try {
      await updateCard(boardId, source.id, {
        listId: targetListId,
        position: insertIndex,
      });
      setCards(await listCards(boardId));
    } catch (error) {
      setCards(previous);
      setCardError(parseApiError(error).message);
    }
  }

  /** Moves the dragged list to the drop target slot, rolling back if the API refuses. */
  async function handleDrop(targetId: string) {
    const sourceId = draggingId;
    setDraggingId(null);
    setDropTargetId(null);

    if (!sourceId || sourceId === targetId) {
      return;
    }

    const previous = lists;
    const sourceIndex = previous.findIndex((item) => item.id === sourceId);
    const targetIndex = previous.findIndex((item) => item.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const reordered = [...previous];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved!);

    setLists(reordered.map((item, index) => ({ ...item, position: index })));
    setReorderError("");

    try {
      setLists(
        await reorderLists(
          boardId,
          reordered.map((item) => item.id),
        ),
      );
    } catch (error) {
      setLists(previous);
      setReorderError(parseApiError(error).message);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Carregando o quadro...</p>;
  }

  if (loadError || !board) {
    return (
      <>
        <p role="alert" className="text-sm text-danger">
          {loadError || "Quadro não encontrado."}
        </p>
        <Link
          href="/quadros"
          className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <BackIcon />
          Quadros
        </Link>
      </>
    );
  }

  const isAdmin = board.role === "admin";

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/quadros"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <BackIcon />
          Quadros
        </Link>

        <span
          className="h-6 w-1.5 rounded-full"
          style={{ backgroundColor: BOARD_COLOR_HEX[board.color] }}
        />

        <h1 className="text-[26px] font-bold tracking-tight">{board.title}</h1>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setModal({ type: "board" })}
            aria-label="Editar quadro"
            title="Editar quadro"
            className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:text-foreground"
          >
            <PencilIcon />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setModal({ type: "labels" })}
          className="ml-auto flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
        >
          <TagIcon />
          Etiquetas
        </button>

        <button
          type="button"
          onClick={() => setModal({ type: "members" })}
          className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
        >
          <MembersIcon />
          Membros
        </button>

        <div className="flex -space-x-2">
          {members
            .filter((member) => member.status === "active")
            .map((member) => (
              <Avatar
                key={member.id}
                seed={member.userId ?? member.email}
                name={member.name}
                title={member.name ?? member.email}
              />
            ))}
        </div>

        <span className="text-sm text-muted">
          {lists.length} {lists.length === 1 ? "lista" : "listas"}
        </span>
      </div>

      {reorderError ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {reorderError}
        </p>
      ) : null}

      {cardError ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          {cardError}
        </p>
      ) : null}

      <LabelFilterBar
        labels={labels}
        selectedLabelIds={selectedLabelIds}
        onToggle={toggleLabelFilter}
        onClear={() => setSelectedLabelIds([])}
      />

      <div className="mt-8 flex gap-6 overflow-x-auto pb-4">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            cards={cards
              .filter((card) => card.listId === list.id)
              .filter(
                (card) =>
                  selectedLabelIds.length === 0 ||
                  cardLabels.some(
                    (cardLabel) =>
                      cardLabel.cardId === card.id &&
                      selectedLabelIds.includes(cardLabel.labelId),
                  ),
              )
              .sort((a, b) => a.position - b.position)}
            checklistItems={checklistItems}
            cardAssignees={cardAssignees}
            members={members}
            cardLabels={cardLabels}
            labels={labels}
            isAdmin={isAdmin}
            isDragging={draggingId === list.id}
            isDropTarget={dropTargetId === list.id && draggingId !== list.id}
            onEdit={(target) => setModal({ type: "editList", list: target })}
            onDelete={(target) => setModal({ type: "deleteList", list: target })}
            onDragStart={() => setDraggingId(list.id)}
            onDragEnter={() => setDropTargetId(list.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setDropTargetId(null);
            }}
            onDrop={() => handleDrop(list.id)}
            isCardDragActive={Boolean(draggingCard)}
            draggingCardId={draggingCard?.id ?? null}
            cardDropTargetId={cardDropTargetId}
            onAddCard={(target) => setModal({ type: "createCard", list: target })}
            onEditCard={(card) => setModal({ type: "editCard", card })}
            onDeleteCard={(card) => setModal({ type: "deleteCard", card })}
            onCardDragStart={(card) => setDraggingCard(card)}
            onCardDragEnter={(cardId) => setCardDropTargetId(cardId)}
            onCardDragEnd={() => {
              setDraggingCard(null);
              setCardDropTargetId(null);
            }}
            onCardDrop={(beforeCardId) => handleCardDrop(list.id, beforeCardId)}
          />
        ))}

        {isAdmin ? (
          <button
            type="button"
            onClick={() => setModal({ type: "createList" })}
            className="flex h-[60px] w-[300px] shrink-0 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-[15px] text-muted transition hover:border-navy hover:text-foreground"
          >
            <PlusIcon />
            Adicionar lista
          </button>
        ) : null}
      </div>

      {modal.type === "board" ? (
        <BoardFormModal
          board={board}
          onClose={closeModal}
          onSubmit={handleBoardUpdate}
        />
      ) : null}

      {modal.type === "createList" ? (
        <ListFormModal
          lists={lists}
          onClose={closeModal}
          onSubmit={handleCreateList}
        />
      ) : null}

      {modal.type === "editList" ? (
        <ListFormModal
          lists={lists}
          list={modal.list}
          onClose={closeModal}
          onSubmit={(input) => handleUpdateList(modal.list.id, input)}
        />
      ) : null}

      {modal.type === "deleteList" ? (
        <DeleteListModal
          list={modal.list}
          cardCount={
            cards.filter((card) => card.listId === modal.list.id).length
          }
          otherLists={lists.filter((item) => item.id !== modal.list.id)}
          onClose={closeModal}
          onConfirm={(input) => handleDeleteList(modal.list.id, input)}
        />
      ) : null}

      {modal.type === "createCard" ? (
        <CardFormModal
          onClose={closeModal}
          onSubmit={(input) => handleCreateCard(modal.list.id, input)}
        />
      ) : null}

      {modal.type === "editCard" ? (
        <CardFormModal
          card={modal.card}
          checklistItems={checklistItems.filter(
            (item) => item.cardId === modal.card.id,
          )}
          onAddChecklistItem={(title) =>
            handleAddChecklistItem(modal.card.id, title)
          }
          onToggleChecklistItem={(item, done) =>
            handleToggleChecklistItem(item, done)
          }
          onDeleteChecklistItem={(item) => handleDeleteChecklistItem(item)}
          assignableMembers={members.filter(
            (member) => member.status === "active",
          )}
          assignees={cardAssignees.filter(
            (assignee) => assignee.cardId === modal.card.id,
          )}
          onAssign={(userId) => handleAssignCard(modal.card.id, userId)}
          onUnassign={handleUnassignCard}
          labels={labels}
          cardLabels={cardLabels.filter(
            (cardLabel) => cardLabel.cardId === modal.card.id,
          )}
          labelUsageCounts={labels.reduce<Record<string, number>>(
            (counts, label) => {
              counts[label.id] = cardLabels.filter(
                (cardLabel) => cardLabel.labelId === label.id,
              ).length;
              return counts;
            },
            {},
          )}
          isAdmin={isAdmin}
          onCreateLabel={handleCreateLabel}
          onDeleteLabel={handleDeleteLabel}
          onAssignLabel={(labelId) => handleAssignLabel(modal.card.id, labelId)}
          onUnassignLabel={handleUnassignLabel}
          comments={comments.filter(
            (comment) => comment.cardId === modal.card.id,
          )}
          currentUserId={user?.id}
          currentUserName={user?.name}
          onAddComment={(body) => handleAddComment(modal.card.id, body)}
          onDeleteComment={handleDeleteComment}
          onClose={closeModal}
          onSubmit={(input) => handleUpdateCard(modal.card.id, input)}
        />
      ) : null}

      {modal.type === "deleteCard" ? (
        <DeleteCardModal
          card={modal.card}
          onClose={closeModal}
          onConfirm={() => handleDeleteCard(modal.card.id)}
        />
      ) : null}

      {modal.type === "members" ? (
        <MembersModal
          members={members}
          currentUserId={user?.id}
          onClose={closeModal}
          onInvite={handleInviteMember}
          onUpdateRole={handleUpdateMemberRole}
          onRemove={handleRemoveMember}
        />
      ) : null}

      {modal.type === "labels" ? (
        <LabelsModal
          labels={labels}
          isAdmin={isAdmin}
          usageCounts={labels.reduce<Record<string, number>>(
            (counts, label) => {
              counts[label.id] = cardLabels.filter(
                (cardLabel) => cardLabel.labelId === label.id,
              ).length;
              return counts;
            },
            {},
          )}
          onCreate={handleCreateLabel}
          onDelete={handleDeleteLabel}
          onClose={closeModal}
        />
      ) : null}
    </>
  );
}
