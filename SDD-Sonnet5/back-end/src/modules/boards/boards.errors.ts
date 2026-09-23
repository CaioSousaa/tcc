import { AppError } from "../../shared/errors";

export class BoardNotFoundError extends AppError {
  constructor() {
    super(404, "board_not_found", "Board not found");
  }
}
