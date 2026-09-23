import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/AppError";
import { MESSAGES } from "../errors/messages";
import { errorHandler, toErrorResponse } from "../middlewares/errorHandler";
import { validate } from "../middlewares/validate";
import { parseRegisterInput } from "../schemas/auth.schemas";

function fakeResponse(headersSent = false) {
  const res = { headersSent, status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("toErrorResponse", () => {
  it.each([
    ["VALIDATION_ERROR", 400, MESSAGES.validationFailed],
    ["EMAIL_ALREADY_EXISTS", 409, "Já existe uma conta com esse e-mail."],
    ["INVALID_CREDENTIALS", 401, "E-mail ou senha inválidos."],
    ["UNAUTHENTICATED", 401, MESSAGES.unauthenticated],
    ["SESSION_EXPIRED", 401, "Sua sessão expirou. Entre novamente."],
    ["BOARD_NOT_FOUND", 404, "Quadro não encontrado."],
    ["LIST_NOT_FOUND", 404, "Lista não encontrada."],
    ["LIST_DELETION_LOCKED", 409, "A exclusão de listas com cards está bloqueada neste quadro."],
    ["LIST_DELETION_STRATEGY_REQUIRED", 409, "Escolha o que deve acontecer com os cards da lista."],
    ["LIST_CARD_COUNT_CHANGED", 409, "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente."],
    ["TARGET_LIST_NOT_FOUND", 409, "A lista de destino não existe mais. Escolha outra lista."],
    ["CHECKLIST_ITEM_NOT_FOUND", 404, "Item não encontrado."],
    ["CHECKLIST_LIMIT_REACHED", 409, "A checklist pode ter no máximo 100 itens."],
    ["INTERNAL_ERROR", 500, "Não foi possível concluir a operação. Tente novamente."],
  ] as const)("maps %s to status %i with the spec message (A8, A10)", (code, status, message) => {
    expect(toErrorResponse(new AppError(code))).toEqual({ status, body: { error: { code, message } } });
  });

  it("includes fields only for VALIDATION_ERROR (A7)", () => {
    const fields = { email: MESSAGES.invalidEmail };
    expect(toErrorResponse(new AppError("VALIDATION_ERROR", fields)).body.error.fields).toEqual(fields);
    expect(toErrorResponse(new AppError("INVALID_CREDENTIALS", fields)).body.error).not.toHaveProperty("fields");
  });

  it("hides internal details of unexpected errors (CE04, A9)", () => {
    const internal = new Error('relation "users" does not exist at /app/src/repositories/UserRepository.ts');
    const { status, body } = toErrorResponse(internal);

    expect(status).toBe(500);
    expect(body).toEqual({ error: { code: "INTERNAL_ERROR", message: MESSAGES.unexpected } });
    expect(JSON.stringify(body)).not.toContain("users");
    expect(JSON.stringify(body)).not.toContain("/app/src");
  });

  it("responds 413 to a body over the limit (plan 4.1)", () => {
    const { status, body } = toErrorResponse({ type: "entity.too.large", status: 413 });
    expect(status).toBe(413);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("responds 400 to malformed JSON", () => {
    expect(toErrorResponse({ type: "entity.parse.failed" }).status).toBe(400);
  });
});

describe("errorHandler", () => {
  const req = { method: "POST", path: "/api/auth/login", body: { password: "senha12345" } } as unknown as Request;

  it("writes the envelope and logs only unexpected errors", () => {
    const log = vi.fn();
    const handler = errorHandler(log);

    const res = fakeResponse();
    handler(new AppError("INVALID_CREDENTIALS"), req, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(log).not.toHaveBeenCalled();

    const res500 = fakeResponse();
    handler(new Error("boom"), req, res500 as unknown as Response, vi.fn());
    expect(res500.status).toHaveBeenCalledWith(500);
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("never logs the request body, so passwords stay out of the logs (N5, N6)", () => {
    const log = vi.fn();
    errorHandler(log)(new Error("boom"), req, fakeResponse() as unknown as Response, vi.fn());
    expect(JSON.stringify(log.mock.calls)).not.toContain("senha12345");
  });

  it("delegates when headers were already sent", () => {
    const next = vi.fn<(error?: unknown) => void>();
    const error = new Error("late");
    const res = fakeResponse(true);
    errorHandler(vi.fn())(error, req, res as unknown as Response, next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe("validate middleware", () => {
  it("replaces the body with normalized data", () => {
    const req = {
      body: { name: " Ana ", email: " ANA@EMPRESA.COM ", password: "senha12345", confirmPassword: "senha12345" },
    } as Request;
    const next = vi.fn<(error?: unknown) => void>();

    validate(parseRegisterInput)(req, {} as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: "Ana", email: "ana@empresa.com", password: "senha12345" });
  });

  it("forwards a VALIDATION_ERROR with every field (CA07, A1)", () => {
    const next = vi.fn<(error?: unknown) => void>();
    validate(parseRegisterInput)({ body: {} } as Request, {} as Response, next as unknown as NextFunction);

    const error = next.mock.calls[0]?.[0] as AppError;
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(error.fields ?? {}).sort()).toEqual(["confirmPassword", "email", "name", "password"]);
  });
});
