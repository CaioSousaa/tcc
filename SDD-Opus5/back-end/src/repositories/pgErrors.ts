import { QueryFailedError } from "typeorm";

const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";

type DriverError = { code?: unknown; constraint?: unknown };

function driverError(error: unknown): DriverError | undefined {
  if (!(error instanceof QueryFailedError)) return undefined;
  return error.driverError as DriverError | undefined;
}

/** Name of the violated unique constraint, or `undefined` when `error` is something else. */
export function uniqueViolation(error: unknown): string | undefined {
  const driver = driverError(error);
  if (driver?.code !== PG_UNIQUE_VIOLATION) return undefined;
  return typeof driver.constraint === "string" ? driver.constraint : "";
}

export function isForeignKeyViolation(error: unknown): boolean {
  return driverError(error)?.code === PG_FOREIGN_KEY_VIOLATION;
}
