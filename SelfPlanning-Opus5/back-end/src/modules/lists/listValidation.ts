import { AppError } from "../../shared/errors/AppError";
import { requireString } from "../../shared/validation/validators";

export const CARD_STRATEGIES = ["move", "delete"] as const;

export type CardStrategy = (typeof CARD_STRATEGIES)[number];

export function requireListName(value: unknown): string {
  const name = requireString(value, "nome da lista");

  if (name.length > 120) {
    throw new AppError("O nome da lista deve ter no máximo 120 caracteres");
  }

  return name;
}

export function requirePosition(value: unknown): number {
  const position = typeof value === "string" ? Number(value) : value;

  if (typeof position !== "number" || !Number.isInteger(position) || position < 0) {
    throw new AppError("A posição deve ser um número inteiro maior ou igual a zero");
  }

  return position;
}

export function optionalCardStrategy(value: unknown): CardStrategy | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !CARD_STRATEGIES.includes(value as CardStrategy)) {
    throw new AppError(
      "A estratégia para os cards deve ser mover para outra lista ou excluir junto com a lista"
    );
  }

  return value as CardStrategy;
}
