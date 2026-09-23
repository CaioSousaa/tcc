import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Rota não encontrada." });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.fields ? { fields: error.fields } : {}),
    });
    return;
  }

  console.error(error);

  res.status(500).json({ message: "Erro interno no servidor." });
}
