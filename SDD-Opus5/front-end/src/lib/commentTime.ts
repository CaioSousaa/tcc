// Moment of a comment in the device time zone (RF09 spec 2.2, plan F129).
// Month abbreviations are fixed: Intl output varies between environments (plan T14).
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

const pad = (value: number) => String(value).padStart(2, "0");

function time(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Calendar day before `date`, across month and year boundaries. */
function previousDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
}

/** "hoje, HH:MM" / "ontem, HH:MM" / "D mmm, HH:MM" / "D mmm AAAA, HH:MM", comparing calendar days, not 24 hours. */
export function formatCommentMoment(iso: string, now: Date): string {
  const date = new Date(iso);
  if (sameDay(date, now)) return `hoje, ${time(date)}`;
  if (sameDay(date, previousDay(now))) return `ontem, ${time(date)}`;
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  if (date.getFullYear() === now.getFullYear()) return `${day}, ${time(date)}`;
  return `${day} ${date.getFullYear()}, ${time(date)}`;
}

/** "DD/MM/AAAA às HH:MM" (spec 2.2). */
export function fullCommentMoment(iso: string): string {
  const date = new Date(iso);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} às ${time(date)}`;
}
