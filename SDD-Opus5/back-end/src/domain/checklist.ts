import { characterCount, normalizeCardTitle } from "./cards";

export const CHECKLIST_ITEM_TEXT_MAX = 200;
export const CHECKLIST_MAX_ITEMS = 100;

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  /** Only for ordering; may have gaps after deletions (RF06 F69). */
  position: number;
};

/** Same rule as the card title: line breaks become spaces, ends trimmed (RF06 RN04, D28). */
export function normalizeChecklistText(value: string): string {
  return normalizeCardTitle(value);
}

export { characterCount };
