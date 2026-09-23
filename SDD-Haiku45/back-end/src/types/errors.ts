export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, "validation_error", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "not_found", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "conflict", message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, "unauthorized", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(403, "forbidden", message);
  }
}
