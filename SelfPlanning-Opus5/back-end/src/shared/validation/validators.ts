import { AppError } from "../errors/AppError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`O campo ${field} é obrigatório`);
  }

  return value.trim();
}

export function requireName(value: unknown): string {
  const name = requireString(value, "nome");

  if (name.length < 3 || name.length > 120) {
    throw new AppError("O nome deve ter entre 3 e 120 caracteres");
  }

  return name;
}

export function requireEmail(value: unknown): string {
  const email = requireString(value, "e-mail").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError("Informe um e-mail válido");
  }

  return email;
}

export function requirePassword(value: unknown): string {
  const password = requireString(value, "senha");

  if (password.length < 8) {
    throw new AppError("A senha deve ter no mínimo 8 caracteres");
  }

  return password;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireUuid(value: unknown, field: string): string {
  const id = requireString(value, field);

  if (!UUID_PATTERN.test(id)) {
    throw new AppError(`O campo ${field} deve ser um identificador válido`);
  }

  return id;
}

export function optionalBoolean(value: unknown, field: string, fallback: boolean): boolean {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "boolean") {
    throw new AppError(`O campo ${field} deve ser verdadeiro ou falso`);
  }

  return value;
}
