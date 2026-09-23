import { describe, expect, it } from "vitest";
import { DUE_DATE_MAX, DUE_DATE_MIN, isCalendarDate, isValidDueDate } from "../domain/dueDate";
import { parseTodayQuery } from "../schemas/board.schemas";

describe("due date domain (RF10 RN01, F142)", () => {
  it("has the 2000–2099 range", () => {
    expect([DUE_DATE_MIN, DUE_DATE_MAX]).toEqual(["2000-01-01", "2099-12-31"]);
  });

  it("accepts existing dates, including leap days (CB01)", () => {
    expect(isValidDueDate("2026-08-29")).toBe(true);
    expect(isValidDueDate("2028-02-29")).toBe(true);
    expect(isValidDueDate("2000-01-01")).toBe(true);
    expect(isValidDueDate("2099-12-31")).toBe(true);
  });

  it.each(["2026-02-29", "2026-04-31", "2026-05-00", "2026-13-13", "2026-8-29", "2026-08-29 ", "29/08/2026", "2026-08-29T00:00"])(
    "rejects %j (CB02, CB04–CB06)",
    (value) => {
      expect(isValidDueDate(value)).toBe(false);
    },
  );

  it("rejects years outside 2000–2099 but still recognizes them as calendar dates (CB03)", () => {
    expect(isValidDueDate("1999-12-31")).toBe(false);
    expect(isValidDueDate("2100-01-01")).toBe(false);
    expect(isCalendarDate("1999-12-31")).toBe(true);
  });

  it("rejects non-strings (CB06)", () => {
    expect(isValidDueDate(20260829)).toBe(false);
    expect(isValidDueDate(null)).toBe(false);
  });
});

describe("parseTodayQuery (RF10 A69)", () => {
  it("is optional", () => {
    expect(parseTodayQuery({})).toEqual({ success: true, data: { today: null } });
  });

  it("accepts a calendar date", () => {
    expect(parseTodayQuery({ today: "2026-08-29" })).toEqual({ success: true, data: { today: "2026-08-29" } });
  });

  it.each(["29/08/2026", "2026-02-30", "", ["2026-08-29"]])("rejects %j", (today) => {
    expect(parseTodayQuery({ today })).toEqual({ success: false, fields: { today: "Informe uma data válida." } });
  });
});
