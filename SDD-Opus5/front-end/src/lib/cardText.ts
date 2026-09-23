export const CARD_TITLE_MAX = 200;
export const CARD_DESCRIPTION_MAX = 5000;

/** Unicode code points, the same count used by the API and the database (RF04 D24). */
export function characterCount(value: string): number {
  return Array.from(value).length;
}

// Built from escapes so no literal line separator ends up in the source.
const TITLE_LINE_BREAKS = new RegExp(["\\r\\n", "\\r", "\\n", "\\u" + "2028", "\\u" + "2029"].join("|"), "g");

/** Each line break becomes one space, then the ends are trimmed (RN03, D26). */
export function normalizeCardTitle(value: string): string {
  return value.replace(TITLE_LINE_BREAKS, " ").trim();
}

/** CRLF/CR → LF, ends trimmed, empty → null (RN04, D21, D25). */
export function normalizeDescription(value: string): string | null {
  const normalized = value.replace(/\r\n?/g, "\n").trim();
  return normalized.length === 0 ? null : normalized;
}
