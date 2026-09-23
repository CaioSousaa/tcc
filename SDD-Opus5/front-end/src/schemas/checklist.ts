import { characterCount, normalizeCardTitle } from "@/lib/cardText";
import { MESSAGES } from "@/lib/messages";
import type { ValidationResult } from "./auth";

export const CHECKLIST_ITEM_TEXT_MAX = 200;

/** Client-side mirror of the API rule, with the card title normalization (RF06 RN04, D28). */
export function validateChecklistText(value: string): ValidationResult<{ text: string }, "text"> {
  const text = normalizeCardTitle(value);
  if (text.length === 0) return { success: false, fields: { text: MESSAGES.required } };
  if (characterCount(text) > CHECKLIST_ITEM_TEXT_MAX) return { success: false, fields: { text: MESSAGES.checklistItemTooLong } };
  return { success: true, data: { text } };
}
