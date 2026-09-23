"use client";

import { FormEvent, useState, useEffect } from "react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import LabelBadge from "./LabelBadge";
import PrazoBadge from "./PrazoBadge";
import { CardChecklist } from "./CardChecklist";
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "@/lib/api";

interface Comment {
  id: string;
  cardId: string;
  usuarioId: string;
  texto: string;
  dataCriacao: string;
  dataAtualizacao: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
  };
}

interface Label {
  id: string;
  nome: string;
  cor: string;
}

interface ChecklistItem {
  id: string;
  titulo: string;
  concluido: boolean;
  ordem: number;
}

interface Card {
  id?: string;
  titulo: string;
  descricao?: string;
  dataPrazo?: string;
  labels?: Label[];
}

interface ListOption {
  id: string;
  titulo: string;
}

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (titulo: string, descricao?: string, dataPrazo?: string, novaListaId?: string) => Promise<void>;
  onDeleteCard?: () => Promise<void>;
  onManageLabels?: () => void;
  loading?: boolean;
  boardId?: string;
  listId?: string;
  lists?: ListOption[];
}

export function CardModal({ isOpen, card, ...rest }: CardModalProps) {
  if (!isOpen) return null;
  return <CardModalForm key={card?.id ?? "new"} card={card} {...rest} />;
}

function CardModalForm({
  card,
  onClose,
  onSubmit,
  onDeleteCard,
  onManageLabels,
  loading = false,
  boardId = "",
  listId = "",
  lists = [],
}: Omit<CardModalProps, "isOpen">) {
  const [titulo, setTitulo] = useState(card?.titulo ?? "");
  const [descricao, setDescricao] = useState(card?.descricao ?? "");
  const [dataPrazo, setDataPrazo] = useState(card?.dataPrazo ? card.dataPrazo.slice(0, 10) : "");
  const [listaSelecionada, setListaSelecionada] = useState(listId);
  const [error, setError] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checklistProgress, setChecklistProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  const isEditing = Boolean(card?.id);

  useEffect(() => {
    if (card?.id) {
      loadComments();
      loadChecklist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComments() {
    if (!card?.id || !boardId || !listId) return;

    try {
      setLoadingComments(true);
      const res = await getComments(boardId, listId, card.id);
      setComments(res.data);
    } catch (err) {
      console.error("Erro ao carregar comentários", err);
    } finally {
      setLoadingComments(false);
    }
  }

  async function loadChecklist() {
    if (!card?.id || !boardId || !listId) return;

    try {
      setLoadingChecklist(true);
      const res = await getChecklistItems(boardId, listId, card.id);
      setChecklistItems(res.data.items);
      setChecklistProgress(res.data.progress);
    } catch (err) {
      console.error("Erro ao carregar checklist", err);
    } finally {
      setLoadingChecklist(false);
    }
  }

  async function handleAddChecklistItem(itemTitulo: string) {
    if (!card?.id || !boardId || !listId) return;
    await createChecklistItem(boardId, listId, card.id, itemTitulo);
    await loadChecklist();
  }

  async function handleToggleChecklistItem(itemId: string, concluido: boolean) {
    if (!card?.id || !boardId || !listId) return;
    await updateChecklistItem(boardId, listId, card.id, itemId, concluido);
    await loadChecklist();
  }

  async function handleDeleteChecklistItem(itemId: string) {
    if (!card?.id || !boardId || !listId) return;
    await deleteChecklistItem(boardId, listId, card.id, itemId);
    await loadChecklist();
  }

  async function handleAddComment(texto: string) {
    if (!card?.id || !boardId || !listId) return;

    try {
      const res = await createComment(boardId, listId, card.id, texto);
      setComments([res.data, ...comments]);
    } catch (err) {
      console.error("Erro ao criar comentário", err);
      throw err;
    }
  }

  async function handleEditComment(commentId: string, texto: string) {
    if (!card?.id || !boardId || !listId) return;

    try {
      const res = await updateComment(boardId, listId, card.id, commentId, texto);
      setComments(comments.map((c) => (c.id === commentId ? res.data : c)));
    } catch (err) {
      console.error("Erro ao editar comentário", err);
      throw err;
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!card?.id || !boardId || !listId) return;

    try {
      await deleteComment(boardId, listId, card.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error("Erro ao deletar comentário", err);
      throw err;
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      setError("Título é obrigatório");
      return;
    }

    if (titulo.length > 100) {
      setError("Título máximo 100 caracteres");
      return;
    }

    try {
      await onSubmit(titulo, descricao || undefined, dataPrazo || undefined, listaSelecionada || undefined);
      onClose();
    } catch (err) {
      setError("Erro ao salvar cartão");
    }
  }

  async function handleDelete() {
    if (!onDeleteCard) return;
    if (!confirm("Tem certeza que deseja deletar este cartão?")) return;
    await onDeleteCard();
  }

  const listaAtual = lists.find((l) => l.id === listId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg max-w-4xl w-full my-8 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="p-6 border-b border-gray-100">
          {listaAtual && (
            <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
              Card · {listaAtual.titulo}
            </p>
          )}
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={100}
            required
            placeholder="Título do cartão"
            autoFocus
            className="w-full text-2xl font-bold text-gray-900 focus:outline-none pr-10"
          />
        </div>

        {error && (
          <div className="mx-6 mt-4 p-2 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-6 md:border-r border-gray-100">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-950 resize-none text-sm"
                placeholder="Descrição do cartão"
              />
            </div>

            {isEditing && (
              <CardChecklist
                items={checklistItems}
                progress={checklistProgress}
                onAddItem={handleAddChecklistItem}
                onToggleItem={handleToggleChecklistItem}
                onDeleteItem={handleDeleteChecklistItem}
                loading={loadingChecklist}
              />
            )}

            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Comentários</h3>
                {boardId && listId && (
                  <>
                    <CommentForm onSubmit={handleAddComment} loading={loadingComments} />
                    <CommentList
                      comments={comments}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      loading={loadingComments}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-full md:w-64 p-6 space-y-6">
            {isEditing && lists.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lista</label>
                <select
                  value={listaSelecionada}
                  onChange={(e) => setListaSelecionada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950"
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.titulo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {card?.labels && card.labels.length > 0 ? (
                    card.labels.map((label) => (
                      <LabelBadge key={label.id} nome={label.nome} cor={label.cor} />
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">Nenhuma etiqueta</span>
                  )}
                </div>
                {onManageLabels && (
                  <button
                    type="button"
                    onClick={onManageLabels}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Gerenciar etiquetas
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prazo</label>
              <input
                type="date"
                value={dataPrazo}
                onChange={(e) => setDataPrazo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
              {dataPrazo && (
                <div className="mt-2 flex items-center justify-between">
                  <PrazoBadge dataPrazo={dataPrazo} />
                  <button
                    type="button"
                    onClick={() => setDataPrazo("")}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-blue-950 hover:bg-blue-900 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm"
              >
                {loading ? "Salvando..." : isEditing ? "Salvar card" : "Criar card"}
              </button>
              {isEditing && onDeleteCard ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition text-sm"
                >
                  Excluir card
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
