import { AppError } from "../../shared/errors";

export class CardLabelNotFoundError extends AppError {
  constructor() {
    super(404, "card_label_not_found", "This label is not associated with this card");
  }
}
