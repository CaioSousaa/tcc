"use client";

import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextArea, TextInput } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { LabelBadge } from "@/components/ui/label-badge";
import { Card } from "@/lib/cards/api";
import { List } from "@/lib/lists/api";
import { Member } from "@/lib/boards-members/api";
import {
  Checklist,
  ChecklistItem,
  createChecklist,
  createChecklistItem,
  deleteChecklistItem,
  listChecklists,
  updateChecklistItem,
} from "@/lib/checklists/api";
import { Comment, createComment, listComments } from "@/lib/comments/api";
import { useAuth } from "@/lib/auth/auth-context";
import { parseApiError } from "@/lib/auth/errors";
import { dueDateLabel } from "@/lib/ui/due-date";

const DEFAULT_CHECKLIST_NAME = "Checklist";

function commentTimeLabel(value: string): string {
  const date = new Date(value);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((startOfToday.getTime() - new Date(date).setHours(0, 0, 0, 0)) / dayMs);
  if (diffDays === 0) return `hoje, ${time}`;
  if (diffDays === 1) return `ontem, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-medium text-foreground">{children}</span>;
}

export function CardDetailModal({
  boardId,
  card,
  lists,
  members,
  onClose,
  onSave,
  onDelete,
  onMoveList,
  onOpenLabels,
  onAssign,
  onUnassign,
  onProgressChanged,
}: {
  boardId: string;
  card: Card;
  lists: List[];
  members: Member[];
  onClose: () => void;
  onSave: (input: { title: string; description: string | null; dueDate: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  onMoveList: (targetListId: string) => Promise<void>;
  onOpenLabels: () => void;
  onAssign: (userId: string) => Promise<void>;
  onUnassign: (userId: string) => Promise<void>;
  onProgressChanged: () => Promise<void>;
}) {
  const { user } = useAuth();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [dueDate, setDueDate] = useState(card.dueDate ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checklists, setChecklists] = useState<Checklist[] | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listChecklists(boardId, card.listId, card.id)
      .then((data) => {
        if (!cancelled) setChecklists(data);
      })
      .catch((err) => {
        if (!cancelled) setDetailError(parseApiError(err).message);
      });
    listComments(boardId, card.listId, card.id)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch((err) => {
        if (!cancelled) setDetailError(parseApiError(err).message);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId, card.id, card.listId]);

  async function handleSave() {
    if (!title.trim()) {
      setError("O título do card é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() === "" ? null : description,
        dueDate: dueDate.trim() === "" ? null : dueDate,
      });
      onClose();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir o card "${card.title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  // O card exibe uma única lista de itens; os itens novos vão para o primeiro checklist (criado sob demanda).
  async function handleAddItem() {
    const text = newItemText.trim();
    if (!text) return;
    setDetailError(null);
    try {
      let target = (checklists ?? [])[0];
      if (!target) {
        target = await createChecklist(boardId, card.listId, card.id, DEFAULT_CHECKLIST_NAME);
        setChecklists([target]);
      }
      const targetId = target.id;
      const item = await createChecklistItem(boardId, card.listId, card.id, targetId, text);
      setChecklists((current) =>
        (current ?? []).map((c) => (c.id === targetId ? { ...c, items: [...c.items, item] } : c)),
      );
      setNewItemText("");
      await onProgressChanged();
    } catch (err) {
      setDetailError(parseApiError(err).message);
    }
  }

  function handleItemInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleAddItem();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      setAddingItem(false);
      setNewItemText("");
    }
  }

  async function handleToggleItem(item: ChecklistItem) {
    try {
      const updated = await updateChecklistItem(
        boardId,
        card.listId,
        card.id,
        item.checklistId,
        item.id,
        !item.completed,
      );
      setChecklists((current) =>
        (current ?? []).map((c) =>
          c.id === item.checklistId
            ? { ...c, items: c.items.map((i) => (i.id === item.id ? updated : i)) }
            : c,
        ),
      );
      await onProgressChanged();
    } catch (err) {
      setDetailError(parseApiError(err).message);
    }
  }

  async function handleDeleteItem(item: ChecklistItem) {
    try {
      await deleteChecklistItem(boardId, card.listId, card.id, item.checklistId, item.id);
      setChecklists((current) =>
        (current ?? []).map((c) =>
          c.id === item.checklistId ? { ...c, items: c.items.filter((i) => i.id !== item.id) } : c,
        ),
      );
      await onProgressChanged();
    } catch (err) {
      setDetailError(parseApiError(err).message);
    }
  }

  async function handleCreateComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newComment.trim()) return;
    try {
      const comment = await createComment(boardId, card.listId, card.id, newComment);
      setComments((current) => [...(current ?? []), comment]);
      setNewComment("");
    } catch (err) {
      setDetailError(parseApiError(err).message);
    }
  }

  const items = (checklists ?? []).flatMap((c) => c.items);
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const availableMembers = members.filter((m) => !card.assignees.some((a) => a.userId === m.userId));
  // /auth/me não devolve o nome; o vínculo com o quadro sempre tem.
  const currentUserName = members.find((m) => m.userId === user?.id)?.name ?? user?.name ?? user?.email ?? "";
  const listName = lists.find((l) => l.id === card.listId)?.name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10 sm:pt-16"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 px-7 pb-5 pt-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Card · {listName}
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSave();
                }
              }}
              aria-label="Título do card"
              placeholder="Título do card"
              maxLength={200}
              className="-mx-2 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold text-foreground hover:border-border focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:bg-black/[.04] hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 border-t border-border md:grid-cols-[1fr_280px]">
          <div className="flex min-w-0 flex-col gap-6 px-7 py-6">
            <div className="flex flex-col gap-2">
              <SectionLabel>Descrição</SectionLabel>
              <TextArea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Adicione uma descrição"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Checklist</SectionLabel>
                {totalItems > 0 && (
                  <span className="font-mono text-xs text-muted">
                    {completedItems}/{totalItems} concluídos
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full bg-green-700 transition-[width]"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <ul className="flex flex-col gap-1">
                {items.map((item) => (
                  <li key={item.id} className="group flex items-center gap-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleItem(item)}
                      aria-label={item.text}
                      className="h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-green-700"
                    />
                    <span
                      className={`flex-1 text-[15px] ${item.completed ? "text-muted line-through" : "text-foreground"}`}
                    >
                      {item.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      aria-label={`Excluir item ${item.text}`}
                      className="px-1 text-muted opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              {addingItem ? (
                <div className="flex items-center gap-2">
                  <TextInput
                    autoFocus
                    value={newItemText}
                    onChange={(event) => setNewItemText(event.target.value)}
                    onKeyDown={handleItemInputKeyDown}
                    placeholder="Descreva o item e tecle Enter"
                    className="flex-1"
                  />
                  <Button type="button" onClick={() => void handleAddItem()} disabled={!newItemText.trim()}>
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAddingItem(false);
                      setNewItemText("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingItem(true)}
                  className="self-start rounded-lg border border-dashed border-border px-3 py-1.5 text-[13px] text-muted hover:border-brand hover:text-brand"
                >
                  + Adicionar item
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <SectionLabel>Comentários</SectionLabel>
              {(comments ?? []).length === 0 && (
                <p className="text-sm text-muted">Nenhum comentário ainda.</p>
              )}
              <ul className="flex flex-col gap-4">
                {(comments ?? []).map((comment) => (
                  <li key={comment.id} className="flex gap-3">
                    <Avatar id={comment.author.id} name={comment.author.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <span className="text-[15px] font-semibold text-foreground">{comment.author.name}</span>
                        <span className="text-xs text-muted">{commentTimeLabel(comment.createdAt)}</span>
                      </p>
                      <p className="whitespace-pre-wrap text-[15px] text-foreground">{comment.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleCreateComment} className="flex gap-3">
                {user && <Avatar id={user.id} name={currentUserName} size="md" />}
                <div className="flex flex-1 flex-col items-start gap-3">
                  <TextArea
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    placeholder="Escreva um comentário"
                    rows={2}
                    className="w-full"
                  />
                  <Button type="submit" disabled={!newComment.trim()}>
                    Comentar
                  </Button>
                </div>
              </form>
            </div>

            {detailError && <p className="text-xs text-red-600">{detailError}</p>}
          </div>

          <aside className="flex flex-col gap-5 border-t border-border bg-black/[.025] px-5 py-6 md:border-l md:border-t-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Lista</span>
              <Select value={card.listId} onChange={(event) => onMoveList(event.target.value)}>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted">Etiquetas</span>
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map((label) => (
                    <LabelBadge key={label.id} name={label.name} color={label.color} />
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" onClick={onOpenLabels} className="self-start py-1.5 text-[13px]">
                Gerenciar etiquetas
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted">Responsáveis</span>
              <div className="flex flex-wrap items-center gap-2">
                {card.assignees.map((assignee) => (
                  <span key={assignee.userId} className="group relative">
                    <Avatar id={assignee.userId} name={assignee.name} size="md" />
                    <button
                      type="button"
                      onClick={() => onUnassign(assignee.userId)}
                      aria-label={`Desatribuir ${assignee.name}`}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] leading-none text-white group-hover:flex focus:flex"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {availableMembers.length > 0 && (
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-muted text-sm text-muted hover:border-brand hover:text-brand">
                    +
                    <select
                      value=""
                      onChange={(event) => event.target.value && onAssign(event.target.value)}
                      aria-label="Atribuir membro"
                      className="absolute inset-0 cursor-pointer opacity-0"
                    >
                      <option value="">+</option>
                      {availableMembers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">Prazo</span>
              <TextInput type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              {card.dueDate && card.dueDate === dueDate && card.dueDateStatus === "overdue" && (
                <p className="mt-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
                  🕐 {dueDateLabel(card.dueDate, card.dueDateStatus)}
                </p>
              )}
              {card.dueDate && card.dueDate === dueDate && card.dueDateStatus === "due_soon" && (
                <p className="mt-1 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-700">
                  🕐 {dueDateLabel(card.dueDate, card.dueDateStatus)}
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="button" onClick={() => void handleSave()} disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar card"}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                className="w-full"
              >
                {deleting ? "Excluindo..." : "Excluir card"}
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
