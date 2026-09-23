import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "internal_error", message: "Unexpected error" } });
}
