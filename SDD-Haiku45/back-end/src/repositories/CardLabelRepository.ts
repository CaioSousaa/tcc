import { Repository, IsNull, In } from "typeorm";
import { CardLabel } from "../entities/CardLabel";
import { AppDataSource } from "../database";

export class CardLabelRepository {
  private repo: Repository<CardLabel>;

  constructor() {
    this.repo = AppDataSource.getRepository(CardLabel);
  }

  async findByCardIds(cardIds: string[]): Promise<CardLabel[]> {
    if (cardIds.length === 0) return [];
    return this.repo.find({
      where: { card_id: In(cardIds) },
      relations: { label: true },
      order: { created_at: "ASC" },
    });
  }

  async insert(cardLabel: Partial<CardLabel>): Promise<CardLabel> {
    const newCardLabel = this.repo.create(cardLabel);
    return this.repo.save(newCardLabel);
  }

  async findByCardId(cardId: string): Promise<CardLabel[]> {
    return this.repo.find({
      where: { card_id: cardId },
      relations: { label: true },
      order: { created_at: "ASC" },
    });
  }

  async findByLabelId(labelId: string): Promise<CardLabel[]> {
    return this.repo.find({
      where: { label_id: labelId },
      relations: { card: true },
    });
  }

  async delete(cardLabelId: string): Promise<void> {
    await this.repo.delete({ id: cardLabelId });
  }

  async deleteByCardId(cardId: string): Promise<void> {
    await this.repo.delete({ card_id: cardId });
  }

  async deleteByLabelId(labelId: string): Promise<void> {
    await this.repo.delete({ label_id: labelId });
  }

  async findDuplicate(cardId: string, labelId: string): Promise<CardLabel | null> {
    return this.repo.findOne({
      where: { card_id: cardId, label_id: labelId },
    });
  }

  async findByCardAndLabel(
    cardId: string,
    labelId: string
  ): Promise<CardLabel | null> {
    return this.repo.findOne({
      where: { card_id: cardId, label_id: labelId },
    });
  }

  async deleteByCardAndLabel(cardId: string, labelId: string): Promise<void> {
    await this.repo.delete({ card_id: cardId, label_id: labelId });
  }
}
