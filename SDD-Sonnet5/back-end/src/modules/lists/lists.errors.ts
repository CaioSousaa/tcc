import { AppError } from "../../shared/errors";

export class ListNotFoundError extends AppError {
  constructor() {
    super(404, "list_not_found", "List not found");
  }
}
