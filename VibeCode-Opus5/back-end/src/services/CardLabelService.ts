import { AppDataSource } from "../data-source";
import { Card } from "../entities/Card";
import { CardLabel } from "../entities/CardLabel";
import { Label } from "../entities/Label";
import { List } from "../entities/List";
import type { CreateCardLabelInput } from "../schemas/card-label.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicCardLabel {
  id: string;
  cardId: string;
  labelId: string;
}

function toPublicCardLabel(cardLabel: CardLabel): PublicCardLabel {
  return {
    id: cardLabel.id,
    cardId: cardLabel.cardId,
    labelId: cardLabel.labelId,
  };
}

export class CardLabelService {
  private get cardLabels() {
    return AppDataSource.getRepository(CardLabel);
  }

  async list(userId: string, boardId: string): Promise<PublicCardLabel[]> {
    await boardService.getAccessibleBoard(userId, boardId);

    const rows = await this.cardLabels
      .createQueryBuilder("cardLabel")
      .innerJoin(Card, "card", "card.id = cardLabel.card_id")
      .innerJoin(List, "list", "list.id = card.list_id")
      .where("list.board_id = :boardId", { boardId })
      .getMany();

    return rows.map(toPublicCardLabel);
  }

  async create(
    userId: string,
    boardId: string,
    input: CreateCardLabelInput,
  ): Promise<PublicCardLabel> {
    await boardService.getAccessibleBoard(userId, boardId);

    await this.getBoardCard(boardId, input.cardId);
    await this.getBoardLabel(boardId, input.labelId);

    const existing = await this.cardLabels.findOne({
      where: { cardId: input.cardId, labelId: input.labelId },
    });

    if (existing) {
      return toPublicCardLabel(existing);
    }

    const created = this.cardLabels.create({
      cardId: input.cardId,
      labelId: input.labelId,
    });

    await this.cardLabels.save(created);

    return toPublicCardLabel(created);
  }

  async remove(
    userId: string,
    boardId: string,
    cardLabelId: string,
  ): Promise<void> {
    await boardService.getAccessibleBoard(userId, boardId);

    const cardLabel = await this.cardLabels.findOne({
      where: { id: cardLabelId },
    });

    if (!cardLabel) {
      throw new AppError("Atribuição não encontrada.", 404);
    }

    await this.getBoardCard(boardId, cardLabel.cardId);
    await this.cardLabels.remove(cardLabel);
  }

  private async getBoardCard(boardId: string, cardId: string): Promise<Card> {
    const card = await AppDataSource.getRepository(Card).findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new AppError("Card não encontrado.", 404);
    }

    const list = await AppDataSource.getRepository(List).findOne({
      where: { id: card.listId },
    });

    if (!list || list.boardId !== boardId) {
      throw new AppError("Card não encontrado.", 404);
    }

    return card;
  }

  private async getBoardLabel(boardId: string, labelId: string): Promise<Label> {
    const label = await AppDataSource.getRepository(Label).findOne({
      where: { id: labelId },
    });

    if (!label || label.boardId !== boardId) {
      throw new AppError("Etiqueta não encontrada.", 404);
    }

    return label;
  }
}

export const cardLabelService = new CardLabelService();
