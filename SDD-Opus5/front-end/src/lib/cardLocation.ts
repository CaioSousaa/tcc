/**
 * Position options of the card dialog (spec 2.3, F45):
 * 1..count in the card's own list, 1..count+1 in another list.
 */
export function cardPositionOptions(countInSelectedList: number, sameList: boolean): number[] {
  const max = sameList ? countInSelectedList : countInSelectedList + 1;
  return Array.from({ length: Math.max(max, 0) }, (_, index) => index + 1);
}

/**
 * Position suggested when the selected list changes (CA27): back to the card's
 * current position in its own list, the end of any other list.
 */
export function suggestedPosition(
  selectedListId: string,
  card: { listId: string; position: number },
  countInSelectedList: number,
): number {
  return selectedListId === card.listId ? card.position : countInSelectedList + 1;
}
