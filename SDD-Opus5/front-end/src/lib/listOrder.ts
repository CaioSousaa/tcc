import type { BoardListItem } from "@/services/boardService";

export const NEW_LIST_PLACEHOLDER = "Nova lista";

export type ListDraft =
  | { mode: "create"; name: string; position: number }
  | { mode: "edit"; listId: string; name: string; position: number };

export type PreviewItem = { key: string; name: string; highlighted: boolean };

/** Create offers 1..N+1, edit offers 1..N (spec 2.2, 2.3). */
export function positionOptions(count: number, mode: ListDraft["mode"]): number[] {
  const max = mode === "create" ? count + 1 : count;
  return Array.from({ length: Math.max(max, 0) }, (_, index) => index + 1);
}

function clamp(position: number, max: number): number {
  return Math.max(1, Math.min(position, max));
}

/**
 * Order the board will have after saving the draft (CA05, CA06, CA18, CA23).
 * Works on a copy: the lists passed in are never modified (C60).
 */
export function previewOrder(lists: readonly BoardListItem[], draft: ListDraft): PreviewItem[] {
  const ordered = [...lists].sort((a, b) => a.position - b.position);
  const typed = draft.name.trim();

  if (draft.mode === "create") {
    const items: PreviewItem[] = ordered.map((list) => ({ key: list.id, name: list.name, highlighted: false }));
    const index = clamp(draft.position, ordered.length + 1) - 1;
    items.splice(index, 0, { key: "new-list", name: typed || NEW_LIST_PLACEHOLDER, highlighted: true });
    return items;
  }

  const editing = ordered.find((list) => list.id === draft.listId);
  if (!editing) return ordered.map((list) => ({ key: list.id, name: list.name, highlighted: false }));

  const items: PreviewItem[] = ordered
    .filter((list) => list.id !== draft.listId)
    .map((list) => ({ key: list.id, name: list.name, highlighted: false }));
  const index = clamp(draft.position, ordered.length) - 1;
  items.splice(index, 0, { key: editing.id, name: typed || editing.name, highlighted: true });
  return items;
}
