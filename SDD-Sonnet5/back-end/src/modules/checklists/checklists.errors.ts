import { AppError } from "../../shared/errors";

export class ChecklistNotFoundError extends AppError {
  constructor() {
    super(404, "checklist_not_found", "Checklist not found");
  }
}

export class ItemNotFoundError extends AppError {
  constructor() {
    super(404, "item_not_found", "Item not found");
  }
}
