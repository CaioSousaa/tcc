export const LIST_DELETION_STRATEGIES = ["move", "cascade"] as const;

/** "move": cards go to the end of another list; "cascade": cards are deleted with the list (RF05). */
export type ListDeletionStrategy = (typeof LIST_DELETION_STRATEGIES)[number];

/**
 * Decision sent with a list deletion. All fields are optional in format: an empty
 * list ignores them (RN02); a list with cards requires strategy and count (RN01).
 */
export type ListDeletionRequest = {
  strategy: ListDeletionStrategy | undefined;
  targetListId: string | undefined;
  /** Number of cards shown to the user when confirming (RN08). */
  expectedCardCount: number | undefined;
};

/** No rule: what the RF03 client sends for an empty list. */
export const NO_DELETION_RULE: ListDeletionRequest = {
  strategy: undefined,
  targetListId: undefined,
  expectedCardCount: undefined,
};
