import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function requireCardTitle(value: unknown): string {
  const title = requireString(value, "título do card");

  if (title.length > 200) {
    throw new AppError("O título do card deve ter no máximo 200 caracteres");
  }

  return title;
}

export function optionalDescription(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new AppError("A descrição deve ser um texto");
  }

  return value.trim() === "" ? null : value.trim();
}

export function optionalDueDate(value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    throw new AppError("O prazo deve estar no formato AAAA-MM-DD");
  }

  if (Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) {
    throw new AppError("O prazo informado não é uma data válida");
  }

  return value;
}
