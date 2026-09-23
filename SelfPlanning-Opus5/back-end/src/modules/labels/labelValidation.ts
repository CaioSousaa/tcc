import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";
import { LABEL_COLORS, LabelColor, isLabelColor } from "./labelColors";

export function requireLabelName(value: unknown): string {
  const name = requireString(value, "nome da etiqueta");

  if (name.length > 60) {
    throw new AppError("O nome da etiqueta deve ter no máximo 60 caracteres");
  }

  return name;
}

export function requireLabelColor(value: unknown): LabelColor {
  if (!isLabelColor(value)) {
    throw new AppError(`A cor deve ser uma destas: ${LABEL_COLORS.join(", ")}`);
  }

  return value;
}
