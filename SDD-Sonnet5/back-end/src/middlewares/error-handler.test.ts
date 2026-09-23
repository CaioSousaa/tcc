import { Request, Response } from "express";
import { errorHandler } from "./error-handler";
import { ValidationError, InvalidCredentialsError } from "../modules/auth/auth.errors";

function buildRes() {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
}

describe("errorHandler", () => {
  it("translates a domain AppError into its declared status code and body", () => {
    const res = buildRes();
    const next = jest.fn();

    errorHandler(new InvalidCredentialsError(), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "invalid_credentials", message: "Invalid email or password" },
    });
  });

  it("includes field-level details for a ValidationError", () => {
    const res = buildRes();
    const next = jest.fn();

    errorHandler(new ValidationError({ email: "email is required" }), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: "validation_error",
        message: "Invalid request payload",
        fields: { email: "email is required" },
      },
    });
  });

  it("maps an unexpected, non-domain error to a generic 500 without leaking details", () => {
    const res = buildRes();
    const next = jest.fn();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    errorHandler(new Error("unexpected database failure"), {} as Request, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "internal_error", message: "Unexpected error" },
    });
    consoleSpy.mockRestore();
  });
});
