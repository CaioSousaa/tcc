import { isBoardColor, type BoardColor } from "@/lib/boardColors";
import { MESSAGES } from "@/lib/messages";
import type { FieldErrors, ValidationResult } from "./auth";

export const BOARD_NAME_MAX = 60;

/** `lockListDeletion` is only shown and sent when editing (RF05 F62). */
export type BoardFormValues = { name: string; color: BoardColor; withDefaultLists: boolean; lockListDeletion: boolean };
export type BoardFormField = keyof BoardFormValues;

/** Client-side mirror of the API rules (RN04, RN06). The API remains the authority. */
export function validateBoardForm(
  values: BoardFormValues,
): ValidationResult<BoardFormValues, BoardFormField> {
  const fields: FieldErrors<BoardFormField> = {};
  const name = values.name.trim();

  if (name.length === 0) fields.name = MESSAGES.required;
  else if (Array.from(name).length > BOARD_NAME_MAX) fields.name = MESSAGES.boardNameTooLong;

  if (!isBoardColor(values.color)) fields.color = MESSAGES.invalidColor;

  if (Object.keys(fields).length > 0) return { success: false, fields };
  return { success: true, data: { ...values, name } };
}
