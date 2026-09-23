import { characterCount, normalizeCardTitle } from "@/lib/cardText";
import { isLabelColor, type LabelColor } from "@/lib/labelColors";
import { MESSAGES } from "@/lib/messages";
import type { FieldErrors, ValidationResult } from "./auth";

export const LABEL_NAME_MAX = 30;

export type LabelFormField = "name" | "color";
export type LabelFormValues = { name: string; color: LabelColor };

/** Client-side mirror of RN02 and RN03; the API remains the authority. */
export function validateLabelForm(values: { name: string; color: string }): ValidationResult<LabelFormValues, LabelFormField> {
  const fields: FieldErrors<LabelFormField> = {};
  const name = normalizeCardTitle(values.name);
  if (name.length === 0) fields.name = MESSAGES.required;
  else if (characterCount(name) > LABEL_NAME_MAX) fields.name = MESSAGES.labelNameTooLong;
  if (!isLabelColor(values.color)) fields.color = MESSAGES.invalidColor;

  if (fields.name || fields.color || !isLabelColor(values.color)) return { success: false, fields };
  return { success: true, data: { name, color: values.color } };
}
