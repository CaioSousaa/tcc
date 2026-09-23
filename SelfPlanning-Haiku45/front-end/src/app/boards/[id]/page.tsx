"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ListColumn } from "@/components/ListColumn";
import { CardItem } from "@/components/CardItem";
import { CardModal } from "@/components/CardModal";
import LabelFilter from "@/components/LabelFilter";
import BoardLabels from "@/components/BoardLabels";
import BoardMembers from "@/components/BoardMembers";
import CardLabelModal from "@/components/CardLabelModal";
import {
  getBoardById,
  getLists,
  getCards,
  getCardsWithLabelFilter,
  createList,
  updateList,
  reorderList,
  deleteList,
  createCard,
  updateCard,
  deleteCard,
  moveCard,
} from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

interface Board {
  id: string;
  titulo: string;
  descricao?: string;
  corFundo: string;
}

interface List {
  id: string;
  titulo: string;
  ordem: number;
}

interface Label {
  id: string;
  nome: string;
  cor: string;
}

interface Card {
  id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  listaId: string;
  labels?: Label[];
}

function BoardViewContent() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [novaLista, setNovaLista] = useState("");
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [savingCard, setSavingCard] = useState(false);
  const [filterLabelIds, setFilterLabelIds] = useState<string[]>([]);
  const [showBoardLabels, setShowBoardLabels] = useState(false);
  const [showBoardMembers, setShowBoardMembers] = useState(false);
  const [showCardLabelModal, setShowCardLabelModal] = useState(false);
  const [cardLabelModalData, setCardLabelModalData] = useState<{ listId: string; cardId: string } | null>(null);

  useEffect(() => {
    loadBoard();
  }, [boardId, filterLabelIds]);

  async function loadBoard() {
    try {
      const boardResp = await getBoardById(boardId);
      setBoard(boardResp.data);

      const listsResp = await getLists(boardId);
      setLists(listsResp.data);

      const cardsMap: Record<string, Card[]> = {};
      for (const list of listsResp.data) {
        const cardsResp = filterLabelIds.length > 0
          ? await getCardsWithLabelFilter(boardId, list.id, filterLabelIds)
          : await getCards(boardId, list.id);
        cardsMap[list.id] = cardsResp.data;
      }
      setCards(cardsMap);
      setModalCard((prev) => {
        if (!prev) return prev;
        const updated = Object.values(cardsMap).flat().find((c) => c.id === prev.id);
        return updated || prev;
      });
      setError("");
    } catch (err) {
      setError("Quadro não encontrado");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateList(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!novaLista.trim()) {
      setError("Nome da lista não pode estar vazio");
      return;
    }

    try {
      const resp = await createList(boardId, novaLista);
      setLists([...lists, resp.data]);
      setNovaLista("");
      setShowCreateForm(false);
    } catch (err) {
      setError("Erro ao criar lista");
    }
  }

  async function handleRename(listId: string, novoTitulo: string) {
    try {
      const resp = await updateList(boardId, listId, novoTitulo);
      setLists(lists.map((l) => (l.id === listId ? resp.data : l)));
    } catch (err) {
      setError("Erro ao renomear lista");
    }
  }

  async function handleDelete(listId: string) {
    const cardsCount = (cards[listId] || []).length;
    const message =
      cardsCount > 0
        ? `Esta lista tem ${cardsCount} cartão${cardsCount !== 1 ? "s" : ""}. Tem certeza que deseja deletar?`
        : "Tem certeza que deseja deletar esta lista?";

    if (!confirm(message)) return;

    try {
      await deleteList(boardId, listId);
      setLists(lists.filter((l) => l.id !== listId));
      const newCards = { ...cards };
      delete newCards[listId];
      setCards(newCards);
    } catch (err) {
      setError("Erro ao deletar lista");
    }
  }

  async function handleReorder(listId: string, novaOrdem: number) {
    try {
      await reorderList(boardId, listId, novaOrdem);
      await loadBoard();
    } catch (err) {
      setError("Erro ao reordenar lista");
    }
  }

  function handleOpenCardModal(listId: string, card?: Card) {
    setSelectedListId(listId);
    setModalCard(card || null);
  }

  async function handleSaveCard(titulo: string, descricao?: string, dataPrazo?: string, novaListaId?: string) {
    if (!selectedListId) return;

    setSavingCard(true);
    try {
      if (modalCard?.id) {
        const resp = await updateCard(boardId, selectedListId, modalCard.id, titulo, descricao, dataPrazo);
        let updatedCard = resp.data;

        if (novaListaId && novaListaId !== selectedListId) {
          const moveResp = await moveCard(boardId, selectedListId, modalCard.id, novaListaId);
          updatedCard = moveResp.data;
          setCards((prev) => ({
            ...prev,
            [selectedListId]: prev[selectedListId].filter((c) => c.id !== modalCard.id),
            [novaListaId]: [...(prev[novaListaId] || []), updatedCard],
          }));
        } else {
          setCards((prev) => ({
            ...prev,
            [selectedListId]: prev[selectedListId].map((c) => (c.id === modalCard.id ? updatedCard : c)),
          }));
        }
      } else {
        const resp = await createCard(boardId, selectedListId, titulo, descricao);
        setCards({
          ...cards,
          [selectedListId]: [...(cards[selectedListId] || []), resp.data],
        });
      }
      setModalCard(null);
      setSelectedListId(null);
    } catch (err) {
      setError("Erro ao salvar cartão");
    } finally {
      setSavingCard(false);
    }
  }

  async function handleDeleteCard(listId: string, cardId: string) {
    if (!confirm("Tem certeza que deseja deletar este cartão?")) return;

    try {
      await deleteCard(boardId, listId, cardId);
      setCards({
        ...cards,
        [listId]: cards[listId].filter((c) => c.id !== cardId),
      });
    } catch (err) {
      setError("Erro ao deletar cartão");
    }
  }

  function handleOpenCardLabelModal(listId: string, cardId: string) {
    setCardLabelModalData({ listId, cardId });
    setShowCardLabelModal(true);
  }

  function handleCloseCardLabelModal() {
    setShowCardLabelModal(false);
    setCardLabelModalData(null);
    loadBoard();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">Carregando...</div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <header className="bg-white border-b border-gray-200">
          <nav className="max-w-full mx-auto px-4 py-4">
            <button
              onClick={() => router.push("/boards")}
              className="text-blue-950 hover:underline"
            >
              ← Voltar
            </button>
          </nav>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/boards")}
              className="text-blue-950 hover:underline"
            >
              Voltar para quadros
            </button>
          </div>
        </main>
      </div>
    );
  }

  const totalCards = Object.values(cards).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-full mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/boards")}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← Quadros
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {board.titulo}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBoardLabels(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              🏷 Etiquetas
            </button>
            <button
              onClick={() => setShowBoardMembers(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
            >
              👥 Membros
            </button>
          </div>
        </nav>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <LabelFilter boardId={boardId} onFilterChange={setFilterLabelIds} />
          <span className="text-sm text-gray-500">{totalCards} card{totalCards !== 1 ? "s" : ""} no quadro</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 overflow-x-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 pb-8 items-start">
          {lists.map((list, index) => (
            <ListColumn
              key={list.id}
              list={list}
              cardCount={(cards[list.id] || []).length}
              onRename={handleRename}
              onDelete={handleDelete}
              onReorderUp={async () => {
                if (index > 0) await handleReorder(list.id, index);
              }}
              onReorderDown={async () => {
                if (index < lists.length - 1) await handleReorder(list.id, index + 2);
              }}
              onCreateCard={handleOpenCardModal}
            >
              {(cards[list.id] || []).map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  onEdit={() => handleOpenCardModal(list.id, card)}
                  onDelete={() => handleDeleteCard(list.id, card.id)}
                  onEditLabels={() => handleOpenCardLabelModal(list.id, card.id)}
                />
              ))}
            </ListColumn>
          ))}

          <div className="min-w-75">
            {showCreateForm ? (
              <form
                onSubmit={handleCreateList}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
              >
                <input
                  type="text"
                  value={novaLista}
                  onChange={(e) => setNovaLista(e.target.value)}
                  maxLength={50}
                  placeholder="Nome da nova lista"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 mb-3 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-sm font-medium"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNovaLista("");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-xl font-medium text-gray-500 hover:text-gray-700 transition"
              >
                + Nova Lista
              </button>
            )}
          </div>
        </div>
      </main>

      <CardModal
        card={modalCard}
        isOpen={selectedListId !== null}
        onClose={() => {
          setModalCard(null);
          setSelectedListId(null);
        }}
        onSubmit={handleSaveCard}
        onDeleteCard={
          modalCard?.id && selectedListId
            ? async () => {
                await handleDeleteCard(selectedListId, modalCard.id);
                setModalCard(null);
                setSelectedListId(null);
              }
            : undefined
        }
        onManageLabels={
          modalCard?.id && selectedListId
            ? () => handleOpenCardLabelModal(selectedListId, modalCard.id)
            : undefined
        }
        loading={savingCard}
        boardId={boardId}
        listId={selectedListId || ""}
        lists={lists}
      />

      {showBoardLabels && (
        <BoardLabels boardId={boardId} onClose={() => setShowBoardLabels(false)} />
      )}

      {showBoardMembers && (
        <BoardMembers boardId={boardId} onClose={() => setShowBoardMembers(false)} />
      )}

      {showCardLabelModal && cardLabelModalData && (
        <CardLabelModal
          boardId={boardId}
          listId={cardLabelModalData.listId}
          cardId={cardLabelModalData.cardId}
          onClose={handleCloseCardLabelModal}
        />
      )}
    </div>
  );
}

export default function BoardViewPage() {
  return (
    <ProtectedRoute>
      <BoardViewContent />
    </ProtectedRoute>
  );
}
