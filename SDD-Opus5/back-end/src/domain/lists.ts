export const LIST_NAME_MAX = 50;

/** A list as exposed by the API. Positions are always exactly 1..N within a board (RN05). */
export type ListItem = {
  id: string;
  name: string;
  position: number;
  cardCount: number;
};

/**
 * A requested position above the current maximum lands on the last valid one
 * (RN09). Validation already guarantees `requested` is a safe integer >= 1.
 */
export function clampPosition(requested: number, max: number): number {
  return Math.max(1, Math.min(requested, max));
}
