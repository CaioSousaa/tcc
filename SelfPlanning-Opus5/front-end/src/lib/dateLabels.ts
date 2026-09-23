const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "hoje, 09:10", "ontem, 16:42" ou a data completa para o restante. */
export function formatCommentDate(isoDate: string): string {
  const date = new Date(isoDate);
  const daysApart = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);

  if (daysApart === 0) {
    return `hoje, ${timeFormatter.format(date)}`;
  }

  if (daysApart === 1) {
    return `ontem, ${timeFormatter.format(date)}`;
  }

  return dateTimeFormatter.format(date).replace(".", "");
}
