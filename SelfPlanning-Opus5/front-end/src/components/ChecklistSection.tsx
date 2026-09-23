"use client";

import { useEffect, useState } from "react";
import { FormMessage } from "./FormMessage";
import {
  ChecklistItem,
  createChecklistItemRequest,
  deleteChecklistItemRequest,
  listChecklistRequest,
  toggleChecklistItemRequest,
  updateChecklistItemRequest,
} from "@/lib/checklistApi";
import { getErrorMessage } from "@/lib/errors";

interface ChecklistSectionProps {
  boardId: string;
  cardId: string;
  onProgressChange: (total: number, done: number) => void;
}

export function ChecklistSection({ boardId, cardId, onProgressChange }: ChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let active = true;

    listChecklistRequest(boardId, cardId)
      .then((loaded) => {
        if (active) {
          setItems(loaded);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Não foi possível carregar o checklist."));
        }
      });

    return () => {
      active = false;
    };
  }, [boardId, cardId]);

  function applyItems(updated: ChecklistItem[]): void {
    setItems(updated);
    onProgressChange(updated.length, updated.filter((item) => item.done).length);
  }

  async function run(
    action: () => Promise<ChecklistItem[]>,
    fallback: string
  ): Promise<void> {
    setError("");
    setIsBusy(true);

    try {
      applyItems(await action());
    } catch (actionError) {
      setError(getErrorMessage(actionError, fallback));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAdd(): Promise<void> {
    const title = newItemTitle.trim();

    if (title.length === 0) {
      return;
    }

    await run(
      () => createChecklistItemRequest(boardId, cardId, title),
      "Não foi possível adicionar o item."
    );

    setNewItemTitle("");
  }

  async function handleRename(item: ChecklistItem): Promise<void> {
    const title = editingTitle.trim();

    setEditingItemId(null);

    if (title.length === 0 || title === item.title) {
      return;
    }

    await run(
      () => updateChecklistItemRequest(boardId, cardId, item.id, title),
      "Não foi possível salvar o item."
    );
  }

  const doneCount = items.filter((item) => item.done).length;
  const progress = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Checklist</h3>
        <span className="text-xs text-muted">
          {doneCount}/{items.length} concluídos
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-green-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              disabled={isBusy}
              onChange={(event) =>
                void run(
                  () =>
                    toggleChecklistItemRequest(boardId, cardId, item.id, event.target.checked),
                  "Não foi possível atualizar o item."
                )
              }
              className="h-4 w-4 accent-brand"
              aria-label={item.title}
            />

            {editingItemId === item.id ? (
              <input
                value={editingTitle}
                onChange={(event) => setEditingTitle(event.target.value)}
                onBlur={() => void handleRename(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleRename(item);
                  }

                  if (event.key === "Escape") {
                    setEditingItemId(null);
                  }
                }}
                autoFocus
                maxLength={200}
                className="h-9 flex-1 rounded-md border border-border bg-surface px-2.5 text-sm outline-none focus:border-brand"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingItemId(item.id);
                  setEditingTitle(item.title);
                }}
                className={`flex-1 text-left text-sm ${
                  item.done ? "text-muted line-through" : "text-foreground"
                }`}
              >
                {item.title}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                void run(
                  () => deleteChecklistItemRequest(boardId, cardId, item.id),
                  "Não foi possível excluir o item."
                )
              }
              aria-label={`Excluir ${item.title}`}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted transition-colors hover:text-red-700"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={newItemTitle}
          onChange={(event) => setNewItemTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleAdd();
            }
          }}
          placeholder="+ Adicionar item"
          maxLength={200}
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => void handleAdd()}
          disabled={isBusy || newItemTitle.trim().length === 0}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-70"
        >
          Adicionar
        </button>
      </div>

      {error ? <FormMessage message={error} /> : null}
    </section>
  );
}
