import { describe, expect, it } from "vitest";
import { cardPositionOptions, suggestedPosition } from "../cardLocation";

const C2 = { listId: "a-fazer", position: 2 };

describe("cardPositionOptions", () => {
  it("offers 1..N in the card's own list (CA17)", () => {
    expect(cardPositionOptions(3, true)).toEqual([1, 2, 3]);
  });

  it("offers 1..M+1 in another list (CA27, CA29)", () => {
    expect(cardPositionOptions(1, false)).toEqual([1, 2]);
    expect(cardPositionOptions(0, false)).toEqual([1]);
  });
});

describe("suggestedPosition (CA27)", () => {
  it("suggests the end of another list", () => {
    expect(suggestedPosition("em-progresso", C2, 1)).toBe(2);
    expect(suggestedPosition("concluido", C2, 0)).toBe(1);
  });

  it("restores the current position when going back to the original list", () => {
    expect(suggestedPosition("a-fazer", C2, 3)).toBe(2);
  });
});
