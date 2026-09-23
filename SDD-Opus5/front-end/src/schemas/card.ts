import { CARD_DESCRIPTION_MAX, CARD_TITLE_MAX, characterCount, normalizeCardTitle, normalizeDescription } from "@/lib/cardText";
import { isValidDueDate } from "@/lib/dueDate";
import { MESSAGES } from "@/lib/messages";
import type { FieldErrors, ValidationResult } from "./auth";

export type NewCardValues = { title: string };
export type CardFormValues = {
  title: string;
  description: string;
  listId: string;
  position: number;
  /** Value of the date input: "" or YYYY-MM-DD (RF10 F148). */
  dueDate: string;
  /** The date input holds an incomplete date, which it reports as "" (RF10 F149). */
  dueDateBadInput?: boolean;
};
/** `dueDate` is always sent: null means no due date (RF10 F136). */
export type CardPayload = { title: string; description: string | null; listId: string; position: number; dueDate: string | null };
export type CardFormField = "title" | "description" | "listId" | "position" | "dueDate";

function titleError(title: string): string | undefined {
  if (title.length === 0) return MESSAGES.required;
  if (characterCount(title) > CARD_TITLE_MAX) return MESSAGES.cardTitleTooLong;
  return undefined;
}

/** Client-side mirror of the API rules (RN03). */
export function validateNewCard(values: NewCardValues): ValidationResult<NewCardValues, "title"> {
  const title = normalizeCardTitle(values.title);
  const error = titleError(title);
  if (error) return { success: false, fields: { title: error } };
  return { success: true, data: { title } };
}

/** Client-side mirror of the API rules (RN03, RN04, RN10). All errors at once (CA22). */
export function validateCardForm(values: CardFormValues): ValidationResult<CardPayload, CardFormField> {
  const fields: FieldErrors<CardFormField> = {};

  const title = normalizeCardTitle(values.title);
  const titleProblem = titleError(title);
  if (titleProblem) fields.title = titleProblem;

  const description = normalizeDescription(values.description);
  if (description !== null && characterCount(description) > CARD_DESCRIPTION_MAX) {
    fields.description = MESSAGES.descriptionTooLong;
  }

  if (!Number.isSafeInteger(values.position) || values.position < 1) fields.position = MESSAGES.invalidPosition;

  // Empty means "no due date"; an incomplete or out-of-range date blocks the whole save (RF10 2.2, CB04).
  const dueDate = values.dueDate === "" ? null : values.dueDate;
  if (values.dueDateBadInput || (dueDate !== null && !isValidDueDate(dueDate))) fields.dueDate = MESSAGES.invalidDate;

  if (Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { title, description, listId: values.listId, position: values.position, dueDate } };
}
