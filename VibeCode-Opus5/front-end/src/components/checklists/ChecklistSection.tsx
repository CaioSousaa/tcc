"use client";

import { useState, type KeyboardEvent } from "react";
import { ChecklistProgressBar } from "@/components/checklists/ChecklistProgressBar";
import { TrashIcon } from "@/components/icons";
import type { ChecklistItem } from "@/lib/checklist-items";
import { parseApiError } from "@/lib/errors";

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (item: ChecklistItem, done: boolean) => Promise<void>;
  onDelete: (item: ChecklistItem) => Promise<void>;
}

export function ChecklistSection({
  items,
  onAdd,
  onToggle,
  onDelete,
}: ChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const doneCount = items.filter((item) => item.done).length;

  async function handleAdd() {
    const title = newItemTitle.trim();

    if (!title) {
      return;
    }

    setError("");
    setIsAdding(true);

    try {
      await onAdd(title);
      setNewItemTitle("");
    } catch (submitError) {
      setError(parseApiError(submitError).message);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    setError("");

    try {
      await onToggle(item, !item.done);
    } catch (toggleError) {
      setError(parseApiError(toggleError).message);
    }
  }

  async function handleDelete(item: ChecklistItem) {
    setError("");

    try {
      await onDelete(item);
    } catch (deleteError) {
      setError(parseApiError(deleteError).message);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Checklist</span>
        {items.length > 0 ? (
          <span className="text-xs text-muted">
            {doneCount}/{items.length} concluídos
          </span>
        ) : null}
      </div>

      <ChecklistProgressBar done={doneCount} total={items.length} />

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-2.5 rounded-lg px-1 py-1"
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleToggle(item)}
                className="h-4 w-4 shrink-0 accent-navy"
              />
              <span
                className={`min-w-0 flex-1 text-[15px] ${
                  item.done ? "text-muted line-through" : "text-foreground"
                }`}
              >
                {item.title}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item)}
                aria-label={`Excluir item ${item.title}`}
                title="Excluir item"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted opacity-0 transition hover:text-danger group-hover:opacity-100"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(event) => setNewItemTitle(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Adicionar item"
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-foreground outline-none transition placeholder:text-muted/70 focus:border-navy focus:ring-2 focus:ring-navy/15"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding || !newItemTitle.trim()}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-[15px] font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          Adicionar
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
