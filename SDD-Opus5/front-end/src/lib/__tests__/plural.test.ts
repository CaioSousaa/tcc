import { describe, expect, it } from "vitest";
import { boardCountsLabel, boardTotalLabel, deleteBoardMessage } from "../plural";

describe("boardTotalLabel", () => {
  it("formats the listing total (CA01, CA05)", () => {
    expect(boardTotalLabel(0)).toBe("0 quadros");
    expect(boardTotalLabel(1)).toBe("1 quadro");
    expect(boardTotalLabel(2)).toBe("2 quadros");
  });
});

describe("boardCountsLabel", () => {
  it("formats list and card counts with singulars (CA04)", () => {
    expect(boardCountsLabel(3, 1)).toBe("3 listas · 1 card");
    expect(boardCountsLabel(5, 11)).toBe("5 listas · 11 cards");
    expect(boardCountsLabel(1, 0)).toBe("1 lista · 0 cards");
  });

  it("adds the overdue suffix only when there are overdue cards (RF10 CA25–CA27)", () => {
    expect(boardCountsLabel(2, 5, 2)).toBe("2 listas · 5 cards · 2 atrasados");
    expect(boardCountsLabel(2, 5, 1)).toBe("2 listas · 5 cards · 1 atrasado");
    expect(boardCountsLabel(2, 5, 0)).toBe("2 listas · 5 cards");
    expect(boardCountsLabel(5, 1200, 1000)).toBe("5 listas · 1200 cards · 1000 atrasados");
  });
});

describe("deleteBoardMessage", () => {
  it("names the board, the amounts and the permanence (CA30, spec 5.4)", () => {
    expect(deleteBoardMessage("Alfa", 3, 5)).toBe(
      'O quadro "Alfa" e todo o seu conteúdo (3 listas e 5 cards) serão excluídos permanentemente. Esta ação não pode ser desfeita.',
    );
  });

  it("uses singulars", () => {
    expect(deleteBoardMessage("Alfa", 1, 1)).toContain("(1 lista e 1 card)");
  });
});
