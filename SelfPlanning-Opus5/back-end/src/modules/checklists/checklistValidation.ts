import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";

export function requireChecklistTitle(value: unknown): string {
  const title = requireString(value, "texto do item");

  if (title.length > 200) {
    throw new AppError("O texto do item deve ter no máximo 200 caracteres");
  }

  return title;
}

export function requireDone(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new AppError("O campo done deve ser verdadeiro ou falso");
  }

  return value;
}
