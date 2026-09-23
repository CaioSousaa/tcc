import { AppError } from "../../shared/errors";

export class MemberNotFoundError extends AppError {
  constructor() {
    super(404, "member_not_found", "Member not found");
  }
}

export class MemberAlreadyExistsError extends AppError {
  constructor() {
    super(409, "member_already_exists", "User is already a member of this board");
  }
}

export class UserNotFoundError extends AppError {
  constructor() {
    super(404, "user_not_found", "User not found");
  }
}

export class LastAdministratorError extends AppError {
  constructor() {
    super(409, "last_administrator_required", "Board must have at least one administrator");
  }
}

export class ForbiddenRoleError extends AppError {
  constructor() {
    super(403, "forbidden_role", "Only a board administrator can perform this action");
  }
}
