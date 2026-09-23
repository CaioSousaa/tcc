/** "1 quadro", "0 quadros", "2 quadros". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function boardTotalLabel(count: number): string {
  return plural(count, "quadro", "quadros");
}

/** "5 listas · 11 cards", plus " · 2 atrasados" when there are overdue cards (RF02 spec 2.1, RF10 spec 2.6). */
export function boardCountsLabel(listCount: number, cardCount: number, overdueCount = 0): string {
  const base = `${plural(listCount, "lista", "listas")} · ${plural(cardCount, "card", "cards")}`;
  return overdueCount > 0 ? `${base} · ${plural(overdueCount, "atrasado", "atrasados")}` : base;
}

/** Confirmation text from spec 5.4. */
export function deleteBoardMessage(name: string, listCount: number, cardCount: number): string {
  return (
    `O quadro "${name}" e todo o seu conteúdo (${plural(listCount, "lista", "listas")} e ` +
    `${plural(cardCount, "card", "cards")}) serão excluídos permanentemente. Esta ação não pode ser desfeita.`
  );
}
