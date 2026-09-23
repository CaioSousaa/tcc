/** Lower case without accents, so "pesquisa" finds "Pesquisa com usuários" and "usuarios" finds "usuários". */
function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Boards whose name contains the typed text, ignoring case, accents and outer spaces; empty text keeps all. */
export function filterBoardsByName<T extends { name: string }>(boards: readonly T[], query: string): T[] {
  const needle = fold(query.trim());
  if (needle.length === 0) return [...boards];
  return boards.filter((board) => fold(board.name).includes(needle));
}
