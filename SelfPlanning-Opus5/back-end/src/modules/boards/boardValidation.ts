import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";
import { BOARD_COLORS, BoardColor, DEFAULT_BOARD_COLOR, isBoardColor } from "./boardColors";

export function requireBoardName(value: unknown): string {
  const name = requireString(value, "nome do quadro");

  if (name.length > 120) {
    throw new AppError("O nome do quadro deve ter no máximo 120 caracteres");
  }

  return name;
}

export function requireBoardColor(value: unknown): BoardColor {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_BOARD_COLOR;
  }

  if (!isBoardColor(value)) {
    throw new AppError(`A cor deve ser uma destas: ${BOARD_COLORS.join(", ")}`);
  }

  return value;
}
