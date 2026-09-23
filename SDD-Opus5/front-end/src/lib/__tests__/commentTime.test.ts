import { describe, expect, it } from "vitest";
import { formatCommentMoment, fullCommentMoment } from "../commentTime";

// Dates are built from local components, so results do not depend on the machine time zone (N197).
const local = (year: number, month: number, day: number, hours: number, minutes: number) =>
  new Date(year, month - 1, day, hours, minutes).toISOString();

const NOW = new Date(2026, 8, 17, 10, 0); // 17/09/2026 10:00

describe("formatCommentMoment (RF09 spec 2.2)", () => {
  it("formats today, yesterday, same year and other year (CA01, CA04)", () => {
    expect(formatCommentMoment(local(2026, 9, 17, 9, 10), NOW)).toBe("hoje, 09:10");
    expect(formatCommentMoment(local(2026, 9, 16, 16, 42), NOW)).toBe("ontem, 16:42");
    expect(formatCommentMoment(local(2026, 9, 17, 0, 5), NOW)).toBe("hoje, 00:05");
    expect(formatCommentMoment(local(2026, 9, 16, 23, 59), NOW)).toBe("ontem, 23:59");
    expect(formatCommentMoment(local(2026, 9, 3, 14, 5), NOW)).toBe("3 set, 14:05");
    expect(formatCommentMoment(local(2025, 12, 28, 8, 0), NOW)).toBe("28 dez 2025, 08:00");
  });

  it("compares calendar days, not the last 24 hours", () => {
    const earlyMorning = new Date(2026, 8, 17, 0, 30);
    expect(formatCommentMoment(local(2026, 9, 16, 23, 50), earlyMorning)).toBe("ontem, 23:50");
    expect(formatCommentMoment(local(2026, 9, 15, 23, 50), NOW)).toBe("15 set, 23:50");
  });

  it("handles yesterday across month and year boundaries", () => {
    expect(formatCommentMoment(local(2026, 2, 28, 18, 0), new Date(2026, 2, 1, 9, 0))).toBe("ontem, 18:00");
    expect(formatCommentMoment(local(2025, 12, 31, 22, 15), new Date(2026, 0, 1, 8, 0))).toBe("ontem, 22:15");
    expect(formatCommentMoment(local(2025, 12, 30, 22, 15), new Date(2026, 0, 1, 8, 0))).toBe("30 dez 2025, 22:15");
  });

  it("uses the fixed lowercase month abbreviations", () => {
    const months = Array.from({ length: 12 }, (_, i) => formatCommentMoment(local(2026, i + 1, 1, 12, 0), new Date(2026, 11, 31, 12, 0)));
    expect(months.map((text) => text.split(" ")[1]?.replace(",", ""))).toEqual([
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ]);
  });
});

describe("fullCommentMoment (spec 2.2)", () => {
  it("formats DD/MM/AAAA às HH:MM", () => {
    expect(fullCommentMoment(local(2026, 9, 17, 9, 10))).toBe("17/09/2026 às 09:10");
    expect(fullCommentMoment(local(2025, 1, 3, 0, 5))).toBe("03/01/2025 às 00:05");
  });
});
