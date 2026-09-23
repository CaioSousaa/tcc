import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";

export function requireCommentText(value: unknown): string {
  const text = requireString(value, "texto do comentário");

  if (text.length > 2000) {
    throw new AppError("O comentário deve ter no máximo 2000 caracteres");
  }

  return text;
}
