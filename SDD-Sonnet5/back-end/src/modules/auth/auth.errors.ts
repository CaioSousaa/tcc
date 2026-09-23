import { AppError } from "../../shared/errors";

export { AppError, ValidationError } from "../../shared/errors";

export class EmailAlreadyInUseError extends AppError {
  constructor() {
    super(409, "email_already_in_use", "This email is already registered");
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "invalid_credentials", "Invalid email or password");
  }
}

export class InvalidSessionError extends AppError {
  constructor() {
    super(401, "invalid_session", "Session is invalid or expired");
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super(401, "unauthenticated", "Authentication required");
  }
}
