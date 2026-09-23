const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

/** Parses a "YYYY-MM-DD" string as a local-midnight Date, avoiding UTC day-shift. */
function parseDueDate(dueDate: string): Date {
  const [year, month, day] = dueDate.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface DueDateStatus {
  label: string;
  isOverdue: boolean;
}

export function getDueDateStatus(dueDate: string): DueDateStatus {
  const due = parseDueDate(dueDate);
  const today = startOfToday();
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return {
      label: `Atrasado há ${daysLate} ${daysLate === 1 ? "dia" : "dias"}`,
      isOverdue: true,
    };
  }

  if (diffDays === 0) {
    return { label: "Vence hoje", isOverdue: false };
  }

  return { label: `Vence ${dateFormatter.format(due)}`, isOverdue: false };
}
