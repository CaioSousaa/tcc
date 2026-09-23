import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { api, isSessionError, toApiError } from "../api";
import { MESSAGES } from "../messages";

function responseError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, null, response);
}

describe("toApiError", () => {
  it("uses the message sent by the API (A8, CA11)", () => {
    const error = responseError(401, {
      error: { code: "INVALID_CREDENTIALS", message: "E-mail ou senha inválidos." },
    });
    expect(toApiError(error)).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "E-mail ou senha inválidos.",
      fields: {},
    });
  });

  it("keeps per-field validation messages (CA07)", () => {
    const fields = { email: MESSAGES.invalidEmail, password: MESSAGES.passwordTooShort };
    const error = responseError(400, { error: { code: "VALIDATION_ERROR", message: "x", fields } });
    expect(toApiError(error).fields).toEqual(fields);
  });

  it("uses the generic message when the server is unreachable (CE01)", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    expect(toApiError(error)).toEqual({ code: "NETWORK_ERROR", message: MESSAGES.unexpected, fields: {} });
  });

  it("never displays an unrecognized server payload (CE04)", () => {
    const error = responseError(500, "<html>Error: at /srv/app/index.js:12</html>");
    expect(toApiError(error)).toEqual({ code: "INTERNAL_ERROR", message: MESSAGES.unexpected, fields: {} });
  });

  it("handles non-axios failures with the generic message", () => {
    expect(toApiError(new Error("boom")).message).toBe(MESSAGES.unexpected);
  });

  it("recognizes BOARD_NOT_FOUND from the API (CA21, CA22)", () => {
    const error = responseError(404, { error: { code: "BOARD_NOT_FOUND", message: "Quadro não encontrado." } });
    expect(toApiError(error)).toEqual({ code: "BOARD_NOT_FOUND", message: "Quadro não encontrado.", fields: {} });
    expect(isSessionError(toApiError(error))).toBe(false);
  });

  it.each([
    ["LIST_NOT_FOUND", 404, "Lista não encontrada."],
    ["LIST_DELETION_LOCKED", 409, "A exclusão de listas com cards está bloqueada neste quadro."],
    ["LIST_DELETION_STRATEGY_REQUIRED", 409, "Escolha o que deve acontecer com os cards da lista."],
    ["LIST_CARD_COUNT_CHANGED", 409, "A lista foi alterada enquanto esta janela estava aberta. Revise e confirme novamente."],
    ["TARGET_LIST_NOT_FOUND", 409, "A lista de destino não existe mais. Escolha outra lista."],
    ["CHECKLIST_ITEM_NOT_FOUND", 404, "Item não encontrado."],
    ["CHECKLIST_LIMIT_REACHED", 409, "A checklist pode ter no máximo 100 itens."],
    ["CARD_NOT_FOUND", 404, "Card não encontrado."],
    ["FORBIDDEN", 403, "Você não tem permissão para esta ação."],
    ["LAST_ADMIN", 409, "O quadro precisa ter pelo menos um administrador."],
    ["ALREADY_MEMBER", 409, "Essa pessoa já participa do quadro."],
    ["INVITATION_ALREADY_PENDING", 409, "Já existe um convite pendente para esse e-mail."],
    ["MEMBER_LIMIT_REACHED", 409, "O quadro atingiu o limite de 50 pessoas."],
    ["INVITATION_NOT_FOUND", 404, "Convite não encontrado."],
    ["MEMBER_NOT_FOUND", 404, "Participante não encontrado."],
    ["ASSIGNEE_NOT_MEMBER", 409, "Essa pessoa não participa do quadro."],
    ["LABEL_NOT_FOUND", 404, "Etiqueta não encontrada."],
    ["LABEL_NAME_TAKEN", 409, "Já existe uma etiqueta com esse nome neste quadro."],
    ["LABEL_LIMIT_REACHED", 409, "O quadro pode ter no máximo 50 etiquetas."],
    ["COMMENT_NOT_FOUND", 404, "Comentário não encontrado."],
    ["COMMENT_LIMIT_REACHED", 409, "O card pode ter no máximo 500 comentários."],
  ] as const)("recognizes %s from the API (RF03 A34)", (code, status, message) => {
    expect(toApiError(responseError(status, { error: { code, message } }))).toEqual({ code, message, fields: {} });
  });

  it("ignores malformed fields", () => {
    const error = responseError(400, { error: { code: "VALIDATION_ERROR", message: "x", fields: ["email"] } });
    expect(toApiError(error).fields).toEqual({});
  });
});

describe("isSessionError", () => {
  it("recognizes expired and missing sessions (CA19, CB12)", () => {
    expect(isSessionError({ code: "SESSION_EXPIRED", message: "", fields: {} })).toBe(true);
    expect(isSessionError({ code: "UNAUTHENTICATED", message: "", fields: {} })).toBe(true);
    expect(isSessionError({ code: "INVALID_CREDENTIALS", message: "", fields: {} })).toBe(false);
  });
});

describe("api client", () => {
  it("sends credentials so the HttpOnly session cookie travels (A18)", () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it("targets the /api prefix", () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
  });
});
