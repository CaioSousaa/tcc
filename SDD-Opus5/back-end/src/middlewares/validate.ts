import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError";
import type { ParseResult } from "../schemas/auth.schemas";

/** Replaces `req.body` with the validated, normalized payload or rejects with all field errors. */
export function validate<T>(parse: (body: unknown) => ParseResult<T>): RequestHandler {
  return (req, _res, next) => {
    const result = parse(req.body);
    if (!result.success) {
      next(new AppError("VALIDATION_ERROR", result.fields));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates `req.query` without replacing it (it is a getter in Express 5); the
 * parsed value is available at `res.locals.query` (RF05 plan 2.2).
 */
export function validateQuery<T>(parse: (query: unknown) => ParseResult<T>): RequestHandler {
  return (req, res, next) => {
    const result = parse(req.query);
    if (!result.success) {
      next(new AppError("VALIDATION_ERROR", result.fields));
      return;
    }
    res.locals.query = result.data;
    next();
  };
}
