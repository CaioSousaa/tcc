"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useBoardApi, Board } from "@/hooks/useBoardApi";
import { useListApi, ListItem } from "@/hooks/useListApi";
import { useCardApi, Card } from "@/hooks/useCardApi";
import { useChecklistApi, ChecklistItem } from "@/hooks/useChecklistApi";
import { useLabelApi, Label } from "@/hooks/useLabelApi";
import { useAssigneeApi, CardAssignee } from "@/hooks/useAssigneeApi";
import { useMemberApi, BoardMember } from "@/hooks/useMemberApi";
import { useCommentApi, Comment as CommentType } from "@/hooks/useCommentApi";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function BoardDetail() {
  const params = useParams();
  const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId || "";
  const router = useRouter();
  const { getBoard } = useBoardApi();
  const { getLists, createList, updateList, deleteList } = useListApi();
  const { getCards, createCard, updateCard, moveCard, deleteCard } = useCardApi();
  const { getChecklistItems, createChecklistItem, updateChecklistItem, deleteChecklistItem } = useChecklistApi();
  const { getLabels, createLabel, deleteLabel, addLabelToCard, removeLabelFromCard } = useLabelApi();
  const { getAssignees, assignUser, removeAssignee } = useAssigneeApi();
  const { getMembers, addMember } = useMemberApi();
  const { getComments, createComment, deleteComment } = useCommentApi();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [cards, setCards] = useState<Map<string, Card[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleteConfirmListId, setDeleteConfirmListId] = useState<string | null>(null);
  const [moveCardsListId, setMoveCardsListId] = useState<string | null>(null);
  const [moveCardsToListId, setMoveCardsToListId] = useState<string | null>(null);

  const [checklists, setChecklists] = useState<Map<string, ChecklistItem[]>>(new Map());
  const [newChecklistItemCardId, setNewChecklistItemCardId] = useState<string | null>(null);
  const [newChecklistItemTitle, setNewChecklistItemTitle] = useState("");

  const [labels, setLabels] = useState<Label[]>([]);
  const [assignees, setAssignees] = useState<Map<string, CardAssignee[]>>(new Map());
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("editor");
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3B82F6");
  const [showNewLabel, setShowNewLabel] = useState(false);

  const [comments, setComments] = useState<Map<string, CommentType[]>>(new Map());
  const [newCommentCardId, setNewCommentCardId] = useState<string | null>(null);
  const [newCommentContent, setNewCommentContent] = useState("");

  const [newCardListId, setNewCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardTitle, setEditingCardTitle] = useState("");
  const [editingCardDescription, setEditingCardDescription] = useState("");
  const [editingCardDueDate, setEditingCardDueDate] = useState("");
  const [deleteConfirmCardId, setDeleteConfirmCardId] = useState<string | null>(null);

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const loadBoardData = async () => {
    try {
      setIsLoading(true);
      const boardData = await getBoard(boardId);
      setBoard(boardData);

      const listsData = await getLists(boardId);
      setLists(listsData);

      const cardsMap = new Map<string, Card[]>();
      const checklistsMap = new Map<string, ChecklistItem[]>();
      const assigneesMap = new Map<string, CardAssignee[]>();
      const commentsMap = new Map<string, CommentType[]>();

      const labelsData = await getLabels(boardId);
      setLabels(labelsData);

      const membersData = await getMembers(boardId);
      setMembers(membersData);

      for (const list of listsData) {
        const listCards = await getCards(list.id);
        cardsMap.set(list.id, listCards);

        for (const card of listCards) {
          const cardChecklists = await getChecklistItems(card.id);
          checklistsMap.set(card.id, cardChecklists);

          const cardAssignees = await getAssignees(card.id);
          assigneesMap.set(card.id, cardAssignees);

          const cardComments = await getComments(card.id);
          commentsMap.set(card.id, cardComments);
        }
      }
      setCards(cardsMap);
      setChecklists(checklistsMap);
      setAssignees(assigneesMap);
      setComments(commentsMap);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao carregar quadro";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) {
      setError("Título da lista é obrigatório");
      return;
    }
    try {
      const newList = await createList(boardId, newListTitle);
      setLists([...lists, newList]);
      setCards(new Map(cards).set(newList.id, []));
      setNewListTitle("");
      setShowNewListForm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar lista";
      setError(errorMessage);
    }
  };

  const handleRenameList = async (listId: string) => {
    if (!editingTitle.trim()) {
      setError("Título é obrigatório");
      return;
    }
    try {
      const updated = await updateList(listId, { title: editingTitle });
      setLists(lists.map((l) => (l.id === listId ? updated : l)));
      setEditingListId(null);
      setEditingTitle("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao renomear lista";
      setError(errorMessage);
    }
  };

  const handleMoveAllCards = async (fromListId: string, toListId: string) => {
    try {
      const cardsToMove = cards.get(fromListId) || [];
      const existingCards = cards.get(toListId) || [];

      for (let i = 0; i < cardsToMove.length; i++) {
        await moveCard(cardsToMove[i].id, toListId, existingCards.length + i);
      }

      const newCards = new Map(cards);
      newCards.set(toListId, [...(newCards.get(toListId) || []), ...cardsToMove]);
      newCards.delete(fromListId);
      setCards(newCards);

      setMoveCardsListId(null);
      setMoveCardsToListId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao mover cards";
      setError(errorMessage);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteList(listId);
      setLists(lists.filter((l) => l.id !== listId));
      const newCards = new Map(cards);
      newCards.delete(listId);
      setCards(newCards);
      setDeleteConfirmListId(null);
      setMoveCardsListId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar lista";
      setError(errorMessage);
    }
  };

  const handleReorderList = async (listId: string, newPosition: number) => {
    if (newPosition < 0 || newPosition >= lists.length) return;
    try {
      await updateList(listId, { position: newPosition });
      const currentIndex = lists.findIndex((l) => l.id === listId);
      const newLists = lists.filter((l) => l.id !== listId);
      newLists.splice(newPosition, 0, lists[currentIndex]);
      setLists(newLists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao reordenar lista";
      setError(errorMessage);
    }
  };

  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) {
      setError("Título do card é obrigatório");
      return;
    }
    try {
      const newCard = await createCard(listId, newCardTitle);
      const listCards = cards.get(listId) || [];
      const newCards = new Map(cards);
      newCards.set(listId, [...listCards, newCard]);
      setCards(newCards);
      setNewCardTitle("");
      setNewCardListId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar card";
      setError(errorMessage);
    }
  };

  const handleUpdateCard = async (cardId: string) => {
    try {
      const updated = await updateCard(cardId, {
        title: editingCardTitle,
        description: editingCardDescription,
        dueDate: editingCardDueDate || null,
      });
      const newCards = new Map(cards);
      for (const [listId, listCards] of newCards) {
        const idx = listCards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          listCards[idx] = updated;
          break;
        }
      }
      setCards(newCards);
      setEditingCardId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar card";
      setError(errorMessage);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCard(cardId);
      const newCards = new Map(cards);
      for (const [listId, listCards] of newCards) {
        const filtered = listCards.filter((c) => c.id !== cardId);
        if (filtered.length !== listCards.length) {
          newCards.set(listId, filtered);
          break;
        }
      }
      setCards(newCards);
      setDeleteConfirmCardId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar card";
      setError(errorMessage);
    }
  };

  const handleMoveCard = async (cardId: string, fromListId: string, toListId: string) => {
    try {
      const listCards = cards.get(toListId) || [];
      const newCard = await moveCard(cardId, toListId, listCards.length);

      const newCards = new Map(cards);
      const fromCards = newCards.get(fromListId) || [];
      newCards.set(fromListId, fromCards.filter((c) => c.id !== cardId));
      newCards.set(toListId, [...(newCards.get(toListId) || []), newCard]);
      setCards(newCards);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao mover card";
      setError(errorMessage);
    }
  };

  const handleAddChecklistItem = async (cardId: string) => {
    if (!newChecklistItemTitle.trim()) {
      setError("Título do item é obrigatório");
      return;
    }
    try {
      const newItem = await createChecklistItem(cardId, newChecklistItemTitle);
      const newChecklists = new Map(checklists);
      newChecklists.set(cardId, [...(newChecklists.get(cardId) || []), newItem]);
      setChecklists(newChecklists);
      setNewChecklistItemTitle("");
      setNewChecklistItemCardId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar item";
      setError(errorMessage);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, currentCompleted: boolean) => {
    try {
      const updated = await updateChecklistItem(itemId, { completed: !currentCompleted });
      const newChecklists = new Map(checklists);
      for (const [cardId, items] of newChecklists) {
        const idx = items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          items[idx] = updated;
          break;
        }
      }
      setChecklists(newChecklists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar item";
      setError(errorMessage);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId);
      const newChecklists = new Map(checklists);
      for (const [cardId, items] of newChecklists) {
        const filtered = items.filter((i) => i.id !== itemId);
        if (filtered.length !== items.length) {
          newChecklists.set(cardId, filtered);
          break;
        }
      }
      setChecklists(newChecklists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar item";
      setError(errorMessage);
    }
  };

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) {
      setError("Nome da label é obrigatório");
      return;
    }
    try {
      const newLabel = await createLabel(boardId, newLabelName, newLabelColor);
      setLabels([...labels, newLabel]);
      setNewLabelName("");
      setNewLabelColor("#3B82F6");
      setShowNewLabel(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao criar label";
      setError(errorMessage);
    }
  };

  const handleToggleCardLabel = async (cardId: string, labelId: string, hasLabel: boolean) => {
    try {
      if (hasLabel) {
        await removeLabelFromCard(cardId, labelId);
      } else {
        await addLabelToCard(cardId, labelId);
      }
      await loadBoardData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar label";
      setError(errorMessage);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setError("Email é obrigatório");
      return;
    }
    try {
      await addMember(boardId, newMemberEmail, newMemberRole);
      const newMembers = await getMembers(boardId);
      setMembers(newMembers);
      setNewMemberEmail("");
      setNewMemberRole("editor");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar membro";
      setError(errorMessage);
    }
  };

  const handleAssignUser = async (cardId: string, memberId: string) => {
    try {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        await assignUser(cardId, member.userId);
        const newAssignees = await getAssignees(cardId);
        const newMap = new Map(assignees);
        newMap.set(cardId, newAssignees);
        setAssignees(newMap);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atribuir usuário";
      setError(errorMessage);
    }
  };

  const handleAddComment = async (cardId: string) => {
    if (!newCommentContent.trim()) {
      setError("Comentário não pode estar vazio");
      return;
    }
    try {
      const newComment = await createComment(cardId, newCommentContent);
      const newMap = new Map(comments);
      newMap.set(cardId, [...(newMap.get(cardId) || []), newComment]);
      setComments(newMap);
      setNewCommentContent("");
      setNewCommentCardId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar comentário";
      setError(errorMessage);
    }
  };

  const handleDeleteComment = async (commentId: string, cardId: string) => {
    try {
      await deleteComment(commentId);
      const newMap = new Map(comments);
      newMap.set(cardId, (newMap.get(cardId) || []).filter((c) => c.id !== commentId));
      setComments(newMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao deletar comentário";
      setError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">Carregando...</div>
      </ProtectedRoute>
    );
  }

  if (!board) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Quadro não encontrado</p>
            <Link href="/boards" className="text-blue-900 mt-4 inline-block">
              Voltar aos quadros
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: `${board.color}20` }}>
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <Link href="/boards" className="text-gray-600 hover:text-gray-900">
                  ←
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
                  {board.description && <p className="text-gray-600 text-sm">{board.description}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMembersModal(true)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  👥 Membros ({members.length})
                </button>
                <button
                  onClick={() => setShowNewLabel(!showNewLabel)}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  🏷️ Labels ({labels.length})
                </button>
              </div>
            </div>

            {showNewLabel && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Nome da label..."
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-10 h-8 border border-gray-300 rounded"
                />
                <button
                  onClick={handleAddLabel}
                  className="px-3 py-1 bg-blue-900 text-white text-sm rounded hover:bg-blue-800"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowNewLabel(false)}
                  className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-full mx-auto px-4 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-6 overflow-x-auto pb-6">
            {lists.map((list, index) => (
              <div key={list.id} className="flex-shrink-0 w-80 bg-white rounded-lg shadow p-4">
                {editingListId === list.id ? (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameList(list.id)}
                      className="px-3 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingListId(null)}
                      className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">{list.title}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingListId(list.id);
                          setEditingTitle(list.title);
                        }}
                        className="text-gray-500 hover:text-gray-900"
                        title="Renomear"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => setDeleteConfirmListId(list.id)}
                        className="text-gray-500 hover:text-red-600"
                        title="Deletar"
                      >
                        🗑
                      </button>
                      <div className="flex gap-0.5">
                        {index > 0 && (
                          <button
                            onClick={() => handleReorderList(list.id, index - 1)}
                            className="text-gray-500 hover:text-gray-900"
                            title="Mover esquerda"
                          >
                            ←
                          </button>
                        )}
                        {index < lists.length - 1 && (
                          <button
                            onClick={() => handleReorderList(list.id, index + 1)}
                            className="text-gray-500 hover:text-gray-900"
                            title="Mover direita"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {deleteConfirmListId === list.id && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-700 mb-2">
                      Deletar "{list.title}"?
                      {(cards.get(list.id) || []).length > 0 && (
                        <span> ({(cards.get(list.id) || []).length} card{(cards.get(list.id) || []).length !== 1 ? 's' : ''})</span>
                      )}
                    </p>

                    {moveCardsListId === list.id ? (
                      <div className="mb-2 space-y-2">
                        <p className="text-xs text-red-600">Mover cards para:</p>
                        {lists
                          .filter((l) => l.id !== list.id)
                          .map((targetList) => (
                            <button
                              key={targetList.id}
                              onClick={() => {
                                handleMoveAllCards(list.id, targetList.id);
                                handleDeleteList(list.id);
                              }}
                              className="w-full px-2 py-1 text-xs text-left bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              {targetList.title}
                            </button>
                          ))}
                        <button
                          onClick={() => setMoveCardsListId(null)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {(cards.get(list.id) || []).length > 0 ? (
                          <>
                            <button
                              onClick={() => setMoveCardsListId(list.id)}
                              className="flex-1 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Mover Cards
                            </button>
                            <button
                              onClick={() => handleDeleteList(list.id)}
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Deletar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDeleteList(list.id)}
                            className="flex-1 px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Deletar
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmListId(null)}
                          className="flex-1 px-2 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {(cards.get(list.id) || []).map((card) => (
                    <div key={card.id} className="bg-gray-50 border border-gray-200 rounded p-3">
                      {editingCardId === card.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingCardTitle}
                            onChange={(e) => setEditingCardTitle(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                          <textarea
                            value={editingCardDescription}
                            onChange={(e) => setEditingCardDescription(e.target.value)}
                            placeholder="Descrição..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={2}
                          />
                          <input
                            type="date"
                            value={editingCardDueDate}
                            onChange={(e) => setEditingCardDueDate(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />

                          {(() => {
                            const cardChecklists = checklists.get(card.id) || [];
                            return (
                              <div className="border-t pt-2">
                                <p className="text-xs font-medium text-gray-700 mb-2">Checklist</p>
                                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
                                  {cardChecklists.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 text-xs">
                                      <input
                                        type="checkbox"
                                        checked={item.completed}
                                        onChange={() => handleToggleChecklistItem(item.id, item.completed)}
                                        className="w-3 h-3"
                                      />
                                      <span
                                        className={`flex-1 ${item.completed ? "line-through text-gray-400" : "text-gray-900"}`}
                                      >
                                        {item.title}
                                      </span>
                                      <button
                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {newChecklistItemCardId === card.id ? (
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={newChecklistItemTitle}
                                      onChange={(e) => setNewChecklistItemTitle(e.target.value)}
                                      placeholder="Novo item..."
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleAddChecklistItem(card.id)}
                                      className="px-2 py-1 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNewChecklistItemCardId(null);
                                        setNewChecklistItemTitle("");
                                      }}
                                      className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setNewChecklistItemCardId(card.id)}
                                    className="w-full px-2 py-1 text-xs border border-dashed border-gray-300 rounded hover:bg-gray-50 text-gray-600"
                                  >
                                    + Item
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {(() => {
                            const cardComments = comments.get(card.id) || [];
                            return (
                              <div className="border-t pt-2">
                                <p className="text-xs font-medium text-gray-700 mb-2">Comentários ({cardComments.length})</p>
                                <div className="space-y-2 mb-2 max-h-24 overflow-y-auto">
                                  {cardComments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 p-2 rounded text-xs">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900">{comment.user.name}</p>
                                          <p className="text-gray-700">{comment.content}</p>
                                          <p className="text-gray-500 text-xs mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteComment(comment.id, card.id)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {newCommentCardId === card.id ? (
                                  <div className="flex gap-1 mb-2">
                                    <input
                                      type="text"
                                      value={newCommentContent}
                                      onChange={(e) => setNewCommentContent(e.target.value)}
                                      placeholder="Novo comentário..."
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleAddComment(card.id)}
                                      className="px-2 py-1 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
                                    >
                                      +
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNewCommentCardId(null);
                                        setNewCommentContent("");
                                      }}
                                      className="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setNewCommentCardId(card.id)}
                                    className="w-full px-2 py-1 text-xs border border-dashed border-gray-300 rounded hover:bg-gray-50 text-gray-600 mb-2"
                                  >
                                    + Comentário
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          <div className="flex gap-1 pt-2">
                            <button
                              onClick={() => handleUpdateCard(card.id)}
                              className="flex-1 px-2 py-1 bg-blue-900 text-white text-xs rounded hover:bg-blue-800"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => setEditingCardId(null)}
                              className="flex-1 px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-100"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-medium text-gray-900 text-sm flex-1">{card.title}</h4>
                            <div className="flex gap-0.5 text-xs">
                              <button
                                onClick={() => {
                                  setEditingCardId(card.id);
                                  setEditingCardTitle(card.title);
                                  setEditingCardDescription(card.description || "");
                                }}
                                className="text-gray-500 hover:text-gray-900"
                              >
                                ✏
                              </button>
                              <button
                                onClick={() => setDeleteConfirmCardId(card.id)}
                                className="text-gray-500 hover:text-red-600"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                          {card.description && (
                            <p className="text-xs text-gray-600 mt-1">{card.description}</p>
                          )}

                          {card.dueDate && (() => {
                            const due = new Date(card.dueDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            due.setHours(0, 0, 0, 0);
                            const isOverdue = due < today;
                            const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            return (
                              <div
                                className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                                  isOverdue
                                    ? "bg-red-100 text-red-700"
                                    : daysUntil <= 3
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-green-100 text-green-700"
                                }`}
                              >
                                📅 {isOverdue ? "Atrasado" : daysUntil === 0 ? "Hoje" : `${daysUntil}d`}
                              </div>
                            );
                          })()}

                          {(assignees.get(card.id) || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {(assignees.get(card.id) || []).map((assignee) => (
                                <span key={assignee.id} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {assignee.user.name.split(" ")[0]}
                                </span>
                              ))}
                            </div>
                          )}
                          {(() => {
                            const cardChecklists = checklists.get(card.id) || [];
                            if (cardChecklists.length > 0) {
                              const completed = cardChecklists.filter((i) => i.completed).length;
                              const percentage = Math.round((completed / cardChecklists.length) * 100);
                              return (
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between items-center text-xs text-gray-600">
                                    <span>Checklist: {completed}/{cardChecklists.length}</span>
                                    <span>{percentage}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          {deleteConfirmCardId === card.id && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-xs text-red-700 mb-1">Deletar?</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="flex-1 px-1 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmCardId(null)}
                                  className="flex-1 px-1 py-0.5 border border-gray-300 text-xs rounded hover:bg-gray-100"
                                >
                                  Não
                                </button>
                              </div>
                            </div>
                          )}
                          {lists.length > 1 && (
                            <div className="mt-2 flex gap-1 text-xs">
                              {lists.map((otherList) => {
                                if (otherList.id === list.id) return null;
                                return (
                                  <button
                                    key={otherList.id}
                                    onClick={() => handleMoveCard(card.id, list.id, otherList.id)}
                                    className="flex-1 px-1 py-0.5 border border-gray-300 rounded hover:bg-blue-50 text-gray-600"
                                  >
                                    → {otherList.title.slice(0, 8)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {newCardListId === list.id ? (
                  <div className="space-y-2 border-t pt-2">
                    <input
                      type="text"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      placeholder="Novo card..."
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCreateCard(list.id)}
                        className="flex-1 px-2 py-1 bg-blue-900 text-white text-sm rounded hover:bg-blue-800"
                      >
                        Criar
                      </button>
                      <button
                        onClick={() => {
                          setNewCardListId(null);
                          setNewCardTitle("");
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewCardListId(list.id)}
                    className="w-full mt-2 p-2 text-gray-600 hover:bg-gray-50 rounded text-sm border border-dashed border-gray-300"
                  >
                    + Card
                  </button>
                )}
              </div>
            ))}

            {showNewListForm ? (
              <div className="flex-shrink-0 w-80 bg-white rounded-lg shadow p-4">
                <input
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="Nome da lista..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateList}
                    className="flex-1 px-3 py-2 bg-blue-900 text-white rounded hover:bg-blue-800"
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewListForm(false);
                      setNewListTitle("");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewListForm(true)}
                className="flex-shrink-0 w-80 h-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition flex items-center justify-center text-gray-600 font-medium"
              >
                + Nova Lista
              </button>
            )}
          </div>
        </main>

        {showMembersModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Membros ({members.length})</h2>

              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => (
                  <div key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-gray-600">{member.user.email}</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email do membro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleAddMember}
                  className="w-full px-3 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 mb-2"
                >
                  Adicionar Membro
                </button>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-full px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
