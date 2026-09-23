export function formatDueDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function daysBetweenTodayAnd(value: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T00:00:00`);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function dueDateLabel(value: string, status: "overdue" | "due_soon" | null): string {
  const diff = daysBetweenTodayAnd(value);
  if (status === "overdue") {
    const days = Math.abs(diff);
    return `Atrasado há ${days} dia${days === 1 ? "" : "s"}`;
  }
  if (diff === 0) return "Vence hoje";
  if (status === "due_soon") return `Vence em ${diff} dia${diff === 1 ? "" : "s"}`;
  return `Vence ${formatDueDate(value)}`;
}
