import { Repository } from "typeorm";
import { CardLabel } from "../entities/card-label.entity";
import { Label } from "../../labels/entities/label.entity";
import {
  CardLabelRepository,
  CreateCardLabelData,
  LabelInfo,
} from "./card-label.repository.types";

export class TypeOrmCardLabelRepository implements CardLabelRepository {
  constructor(private readonly repo: Repository<CardLabel>) {}

  async create(data: CreateCardLabelData): Promise<CardLabel> {
    const existing = await this.repo.findOne({
      where: { cardId: data.cardId, labelId: data.labelId },
    });
    if (existing) {
      return existing;
    }
    const cardLabel = this.repo.create(data);
    return this.repo.save(cardLabel);
  }

  async delete(cardId: string, labelId: string): Promise<boolean> {
    const result = await this.repo.delete({ cardId, labelId });
    return (result.affected ?? 0) > 0;
  }

  async findAllByCardIds(cardIds: string[]): Promise<Record<string, LabelInfo[]>> {
    if (cardIds.length === 0) {
      return {};
    }

    const rows = await this.repo
      .createQueryBuilder("cardLabel")
      .innerJoin(Label, "label", "label.id = cardLabel.label_id")
      .select("cardLabel.card_id", "cardId")
      .addSelect("label.id", "id")
      .addSelect("label.name", "name")
      .addSelect("label.color", "color")
      .where("cardLabel.card_id IN (:...cardIds)", { cardIds })
      .orderBy("label.created_at", "ASC")
      .getRawMany<{ cardId: string; id: string; name: string; color: string }>();

    const result: Record<string, LabelInfo[]> = {};
    for (const row of rows) {
      const list = result[row.cardId] ?? (result[row.cardId] = []);
      list.push({ id: row.id, name: row.name, color: row.color as LabelInfo["color"] });
    }
    return result;
  }

  async filterCardIdsByLabels(cardIds: string[], labelIds: string[]): Promise<Set<string>> {
    if (cardIds.length === 0 || labelIds.length === 0) {
      return new Set();
    }

    const rows = await this.repo
      .createQueryBuilder("cardLabel")
      .select("DISTINCT cardLabel.card_id", "cardId")
      .where("cardLabel.card_id IN (:...cardIds)", { cardIds })
      .andWhere("cardLabel.label_id IN (:...labelIds)", { labelIds })
      .getRawMany<{ cardId: string }>();

    return new Set(rows.map((row) => row.cardId));
  }
}
