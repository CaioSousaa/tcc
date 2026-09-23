"use client";

import { useId, useState } from "react";
import { Alert } from "@/components/Alert";
import { PlusIcon } from "@/components/boards/icons";
import { toApiError, type ApiError } from "@/lib/api";
import {
  checklistFailureAction,
  checklistProgress,
  sectionLabel,
  summarize,
  type ChecklistOperation,
  type ChecklistSummary,
} from "@/lib/checklist";
import { MESSAGES } from "@/lib/messages";
import { cardService } from "@/services/cardService";
import { checklistService, type ChecklistItem } from "@/services/checklistService";
import { AddChecklistItemForm } from "./AddChecklistItemForm";
import { ChecklistItemRow } from "./ChecklistItemRow";
import { ChecklistProgress } from "./ChecklistProgress";

type Props = {
  boardId: string;
  cardId: string;
  initialItems: ChecklistItem[];
  /** Board page updates the card face (C133). */
  onChange: (summary: ChecklistSummary) => void;
  /** Board or card is gone; the board page closes the dialog or shows BoardNotFound (CA38). */
  onCardGone: (error: ApiError) => void;
};

type Mode = null | { kind: "add" } | { kind: "edit"; itemId: string };

/**
 * "Checklist" section of the card dialog (RF06 spec 2.1–2.7). Every action is
 * saved immediately and does not depend on "Salvar card" (RN11, C137).
 */
export function ChecklistSection({ boardId, cardId, initialItems, onChange, onCardGone }: Props) {
  const labelId = useId();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  // A single value: one edit at a time, exclusive with the add field (C134, CA26).
  const [mode, setMode] = useState<Mode>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);

  const progress = checklistProgress(summarize(items).done, items.length);

  function apply(checklist: ChecklistItem[]) {
    setItems(checklist);
    onChange(summarize(checklist));
  }

  async function reload() {
    try {
      apply((await cardService.get(boardId, cardId)).checklist);
    } catch (error) {
      const apiError = toApiError(error);
      if (checklistFailureAction("toggle", apiError) === "card-gone") onCardGone(apiError);
    }
  }

  /** Returns normally when handled here; rethrows when the field must show the message. */
  async function handleFailure(operation: ChecklistOperation, error: unknown) {
    const apiError = toApiError(error);
    switch (checklistFailureAction(operation, apiError)) {
      case "card-gone":
        onCardGone(apiError);
        return;
      case "reload-with-message":
        setMode(null);
        setNotice(apiError.message);
        await reload();
        return;
      case "reload-silently":
        await reload();
        return;
      case "show-in-field":
        throw error;
      default:
        setNotice(apiError.message);
    }
  }

  function setPending(itemId: string, on: boolean) {
    setPendingIds((current) => {
      const next = new Set(current);
      if (on) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  async function add(text: string) {
    setNotice(null);
    try {
      apply((await checklistService.add(boardId, cardId, text)).checklist);
    } catch (error) {
      await handleFailure("add", error);
    }
  }

  /** No optimistic update: the checkbox changes when the saved state comes back (C135, CE02). */
  async function toggle(item: ChecklistItem) {
    if (pendingIds.has(item.id)) return;
    setNotice(null);
    setPending(item.id, true);
    try {
      apply((await checklistService.update(boardId, cardId, item.id, { done: !item.done })).checklist);
    } catch (error) {
      await handleFailure("toggle", error);
    } finally {
      setPending(item.id, false);
    }
  }

  async function saveText(item: ChecklistItem, text: string) {
    setNotice(null);
    try {
      apply((await checklistService.update(boardId, cardId, item.id, { text })).checklist);
      setMode(null);
    } catch (error) {
      await handleFailure("edit", error);
    }
  }

  async function remove(item: ChecklistItem) {
    if (pendingIds.has(item.id)) return;
    setNotice(null);
    setPending(item.id, true);
    try {
      apply(await checklistService.remove(boardId, cardId, item.id));
      if (mode?.kind === "edit" && mode.itemId === item.id) setMode(null);
    } catch (error) {
      await handleFailure("remove", error);
    } finally {
      setPending(item.id, false);
    }
  }

  return (
    <section aria-labelledby={`${labelId}-title`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${labelId}-title`} className="text-sm font-medium text-ink">
          {MESSAGES.checklistTitle}
        </h3>
        {progress ? <span className="font-mono text-xs text-muted">{sectionLabel(progress)}</span> : null}
      </div>

      {progress ? <ChecklistProgress progress={progress} variant="section" labelId={`${labelId}-progress`} /> : null}
      {notice ? <Alert>{notice}</Alert> : null}

      {items.length === 0 ? (
        <p className="text-[15px] text-muted">{MESSAGES.checklistEmpty}</p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => (
            <ChecklistItemRow
              key={mode?.kind === "edit" && mode.itemId === item.id ? `${item.id}-edit` : item.id}
              item={item}
              editing={mode?.kind === "edit" && mode.itemId === item.id}
              pending={pendingIds.has(item.id)}
              onToggle={(target) => void toggle(target)}
              onRemove={(target) => void remove(target)}
              onStartEdit={(target) => setMode({ kind: "edit", itemId: target.id })}
              onCancelEdit={() => setMode(null)}
              onSaveText={saveText}
            />
          ))}
        </ul>
      )}

      {mode?.kind === "add" ? (
        <AddChecklistItemForm onSubmit={add} onCancel={() => setMode(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setMode({ kind: "add" })}
          className="flex h-9 w-fit items-center gap-1.5 rounded-lg border border-dashed border-muted/50 px-3 text-sm text-muted transition hover:border-brand hover:text-brand"
        >
          <PlusIcon />
          {MESSAGES.checklistAdd.replace("+ ", "")}
        </button>
      )}
    </section>
  );
}
