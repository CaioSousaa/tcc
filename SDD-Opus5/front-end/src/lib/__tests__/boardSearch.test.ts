import { describe, expect, it } from "vitest";
import { filterBoardsByName } from "../boardSearch";

const boards = [{ name: "Redesign do app · Sprint 12" }, { name: "Plataforma · Infra 2026" }, { name: "Pesquisa com usuários" }, { name: "Onboarding do time" }];
const names = (list: Array<{ name: string }>) => list.map((b) => b.name);

describe("filterBoardsByName", () => {
  it("keeps every board for an empty or blank query", () => {
    expect(filterBoardsByName(boards, "")).toHaveLength(4);
    expect(filterBoardsByName(boards, "   ")).toHaveLength(4);
  });

  it("matches a part of the name ignoring case and outer spaces", () => {
    expect(names(filterBoardsByName(boards, "  SPRINT "))).toEqual(["Redesign do app · Sprint 12"]);
    expect(names(filterBoardsByName(boards, "do "))).toEqual(["Redesign do app · Sprint 12", "Onboarding do time"]);
  });

  it("ignores accents in both directions", () => {
    expect(names(filterBoardsByName(boards, "usuarios"))).toEqual(["Pesquisa com usuários"]);
    expect(names(filterBoardsByName([{ name: "Revisao" }], "revisão"))).toEqual(["Revisao"]);
  });

  it("returns nothing when there is no match and keeps the original order", () => {
    expect(filterBoardsByName(boards, "xyz")).toEqual([]);
    expect(names(filterBoardsByName(boards, "o"))[0]).toBe("Redesign do app · Sprint 12");
  });
});
