import { AppError } from "../../shared/errors";

export class AssignmentNotFoundError extends AppError {
  constructor() {
    super(404, "assignment_not_found", "This user is not assigned to this card");
  }
}
