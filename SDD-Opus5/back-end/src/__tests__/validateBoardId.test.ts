import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/AppError";
import { toErrorResponse } from "../middlewares/errorHandler";
import { validateBoardId } from "../middlewares/validateBoardId";

function run(boardId: string) {
  const next = vi.fn<(error?: unknown) => void>();
  validateBoardId({ params: { boardId } } as unknown as Request, {} as Response, next as unknown as NextFunction);
  return next;
}

describe("validateBoardId", () => {
  it("lets a UUID through", () => {
    expect(run("7d1f2a57-4f7e-4a41-9d2c-2d8a7f7e1b10")).toHaveBeenCalledWith();
  });

  it.each(["123", "abc", "7d1f2a57-4f7e-4a41-9d2c", "../../etc"])(
    "answers malformed id %s as BOARD_NOT_FOUND before any query (CA22, N30)",
    (boardId) => {
      const next = run(boardId);
      const error = next.mock.calls[0]?.[0];
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("BOARD_NOT_FOUND");
    },
  );

  it("produces the same 404 response as a missing board (RN03, plan A27)", () => {
    const error = run("abc").mock.calls[0]?.[0];
    expect(toErrorResponse(error)).toEqual(toErrorResponse(new AppError("BOARD_NOT_FOUND")));
    expect(toErrorResponse(error)).toEqual({
      status: 404,
      body: { error: { code: "BOARD_NOT_FOUND", message: "Quadro não encontrado." } },
    });
  });
});
