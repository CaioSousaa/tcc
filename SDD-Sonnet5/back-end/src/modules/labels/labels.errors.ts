import { AppError } from "../../shared/errors";

export class LabelNotFoundError extends AppError {
  constructor() {
    super(404, "label_not_found", "Label not found");
  }
}
