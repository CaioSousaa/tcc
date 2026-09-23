export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (fields) {
      this.fields = fields;
    }
  }
}

export class ValidationError extends AppError {
  constructor(fields: Record<string, string>) {
    super(400, "validation_error", "Invalid request payload", fields);
  }
}
