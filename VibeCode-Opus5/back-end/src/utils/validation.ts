import type { ZodType } from "zod";
import { AppError } from "./AppError";

/** Runs a Zod schema and turns issues into a 422 AppError with per-field messages. */
export function validate<T>(schema: ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);

  if (result.success) {
    return result.data;
  }

  const fields: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "form";

    if (!fields[field]) {
      fields[field] = issue.message;
    }
  }

  return throwValidationError(fields);
}

function throwValidationError(fields: Record<string, string>): never {
  const firstMessage = Object.values(fields)[0] ?? "Dados inválidos.";

  throw new AppError(firstMessage, 422, fields);
}
