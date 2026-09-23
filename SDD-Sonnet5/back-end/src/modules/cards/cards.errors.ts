import { AppError } from "../../shared/errors";

export class CardNotFoundError extends AppError {
  constructor() {
    super(404, "card_not_found", "Card not found");
  }
}
