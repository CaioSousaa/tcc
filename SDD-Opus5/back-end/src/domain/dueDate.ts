/** Accepted range of a card due date (RF10 RN01). Text comparison works for YYYY-MM-DD. */
export const DUE_DATE_MIN = "2000-01-01";
export const DUE_DATE_MAX = "2099-12-31";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `YYYY-MM-DD` text that exists in the calendar, checked by a Date.UTC round trip (plan F142). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Calendar date within 2000-01-01..2099-12-31 (RF10 RN01, CB01–CB06). */
export function isValidDueDate(value: unknown): value is string {
  return isCalendarDate(value) && value >= DUE_DATE_MIN && value <= DUE_DATE_MAX;
}
