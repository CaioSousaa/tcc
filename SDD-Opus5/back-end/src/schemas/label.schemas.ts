import { LABEL_NAME_MAX, characterCount, isLabelColor, normalizeLabelName, type LabelColor } from "../domain/labels";
import type { FieldErrors } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import type { ParseResult } from "./auth.schemas";

/** Creation and edition take both fields (RF08 plan A59). */
export type LabelInput = { name: string; color: LabelColor };

function toObject(body: unknown): Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

/** Name and color, every field error at once; board, usage or dates sent by the client are dropped (CB07). */
export function parseLabelInput(body: unknown): ParseResult<LabelInput> {
  const raw = toObject(body);
  const fields: FieldErrors = {};

  let name: string | undefined;
  if (typeof raw.name !== "string" || normalizeLabelName(raw.name).length === 0) {
    fields.name = MESSAGES.required;
  } else {
    name = normalizeLabelName(raw.name);
    if (characterCount(name) > LABEL_NAME_MAX) fields.name = MESSAGES.labelNameTooLong;
  }

  if (!isLabelColor(raw.color)) fields.color = MESSAGES.invalidColor;

  if (name === undefined || !isLabelColor(raw.color) || Object.keys(fields).length > 0) {
    return { success: false, fields };
  }
  return { success: true, data: { name, color: raw.color } };
}
