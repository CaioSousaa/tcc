const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

function todayAsIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

export function isOverdue(dueDate: string): boolean {
  return dueDate < todayAsIsoDate();
}

export function isDueToday(dueDate: string): boolean {
  return dueDate === todayAsIsoDate();
}

function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);

  if (!fromYear || !fromMonth || !fromDay || !toYear || !toMonth || !toDay) {
    return 0;
  }

  const start = new Date(fromYear, fromMonth - 1, fromDay).getTime();
  const end = new Date(toYear, toMonth - 1, toDay).getTime();

  return Math.round((end - start) / 86_400_000);
}

/** "Atrasado há 2 dias", "Vence hoje" ou "Vence 12 set". */
export function describeDueDate(dueDate: string): string {
  if (isDueToday(dueDate)) {
    return "Vence hoje";
  }

  if (isOverdue(dueDate)) {
    const days = daysBetween(dueDate, todayAsIsoDate());

    return days === 1 ? "Atrasado há 1 dia" : `Atrasado há ${days} dias`;
  }

  return `Vence ${formatDueDate(dueDate)}`;
}

/** Formata o prazo sem passar por fuso horário, já que a data vem como AAAA-MM-DD. */
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);

  if (!year || !month || !day) {
    return dueDate;
  }

  return dayMonthFormatter.format(new Date(year, month - 1, day)).replace(".", "");
}
