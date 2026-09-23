export class AppError extends Error {
  readonly statusCode: number;
  readonly fields: Record<string, string> | undefined;

  constructor(
    message: string,
    statusCode = 400,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
