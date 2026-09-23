import { MESSAGES } from "@/lib/messages";
import type { FieldErrors, ValidationResult } from "./auth";

export const LIST_NAME_MAX = 50;

export type ListFormValues = { name: string; position: number };
export type ListFormField = keyof ListFormValues;

/** Client-side mirror of the API rules (RN03, RN09). The API remains the authority. */
export function validateListForm(values: ListFormValues): ValidationResult<ListFormValues, ListFormField> {
  const fields: FieldErrors<ListFormField> = {};
  const name = values.name.trim();

  if (name.length === 0) fields.name = MESSAGES.required;
  else if (Array.from(name).length > LIST_NAME_MAX) fields.name = MESSAGES.listNameTooLong;

  if (!Number.isSafeInteger(values.position) || values.position < 1) fields.position = MESSAGES.invalidPosition;

  if (Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { name, position: values.position } };
}
