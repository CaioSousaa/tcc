import { describe, expect, it } from "vitest";
import type { BoardListItem } from "@/services/boardService";
import { NEW_LIST_PLACEHOLDER, positionOptions, previewOrder } from "../listOrder";

const SPRINT: BoardListItem[] = [
  { id: "a", name: "A fazer", position: 1, cardCount: 0, cards: [] },
  { id: "b", name: "Em progresso", position: 2, cardCount: 0, cards: [] },
  { id: "c", name: "Concluído", position: 3, cardCount: 0, cards: [] },
];

const view = (items: ReturnType<typeof previewOrder>) =>
  items.map((item) => (item.highlighted ? `*${item.name}` : item.name));

describe("positionOptions", () => {
  it("offers 1..N+1 when adding (CA05, CA10)", () => {
    expect(positionOptions(3, "create")).toEqual([1, 2, 3, 4]);
    expect(positionOptions(0, "create")).toEqual([1]);
  });

  it("offers 1..N when editing (CA18, CA30)", () => {
    expect(positionOptions(3, "edit")).toEqual([1, 2, 3]);
    expect(positionOptions(2, "edit")).toEqual([1, 2]);
  });
});

describe("previewOrder — create", () => {
  it("shows the placeholder highlighted at the end by default (CA05)", () => {
    expect(view(previewOrder(SPRINT, { mode: "create", name: "", position: 4 }))).toEqual([
      "A fazer",
      "Em progresso",
      "Concluído",
      `*${NEW_LIST_PLACEHOLDER}`,
    ]);
    expect(NEW_LIST_PLACEHOLDER).toBe("Nova lista");
  });

  it("follows typed name and chosen position (CA06, RN06)", () => {
    expect(view(previewOrder(SPRINT, { mode: "create", name: "Revisão", position: 3 }))).toEqual([
      "A fazer",
      "Em progresso",
      "*Revisão",
      "Concluído",
    ]);
  });

  it("places at the start (CA09)", () => {
    expect(view(previewOrder(SPRINT, { mode: "create", name: "Backlog", position: 1 }))).toEqual([
      "*Backlog",
      "A fazer",
      "Em progresso",
      "Concluído",
    ]);
  });

  it("uses the placeholder for a whitespace-only name", () => {
    expect(view(previewOrder([], { mode: "create", name: "   ", position: 1 }))).toEqual([`*${NEW_LIST_PLACEHOLDER}`]);
  });
});

describe("previewOrder — edit", () => {
  it("highlights the edited list in its current place (CA18)", () => {
    expect(view(previewOrder(SPRINT, { mode: "edit", listId: "b", name: "Em progresso", position: 2 }))).toEqual([
      "A fazer",
      "*Em progresso",
      "Concluído",
    ]);
  });

  it("moves right (CA20, CA23, RN07)", () => {
    expect(view(previewOrder(SPRINT, { mode: "edit", listId: "a", name: "A fazer", position: 3 }))).toEqual([
      "Em progresso",
      "Concluído",
      "*A fazer",
    ]);
  });

  it("moves left (CA21, RN07)", () => {
    expect(view(previewOrder(SPRINT, { mode: "edit", listId: "c", name: "Concluído", position: 1 }))).toEqual([
      "*Concluído",
      "A fazer",
      "Em progresso",
    ]);
  });

  it("renames and moves at once (CA22)", () => {
    expect(view(previewOrder(SPRINT, { mode: "edit", listId: "a", name: "Backlog", position: 2 }))).toEqual([
      "Em progresso",
      "*Backlog",
      "Concluído",
    ]);
  });

  it("never changes the lists it receives, so the board behind stays as it was (CA23, C60)", () => {
    const copy = structuredClone(SPRINT);
    previewOrder(SPRINT, { mode: "edit", listId: "a", name: "X", position: 3 });
    previewOrder(SPRINT, { mode: "create", name: "Y", position: 1 });
    expect(SPRINT).toEqual(copy);
  });

  it("orders by position even if the input is not sorted", () => {
    const shuffled = [SPRINT[2], SPRINT[0], SPRINT[1]] as BoardListItem[];
    expect(view(previewOrder(shuffled, { mode: "create", name: "Z", position: 4 }))).toEqual([
      "A fazer",
      "Em progresso",
      "Concluído",
      "*Z",
    ]);
  });
});
