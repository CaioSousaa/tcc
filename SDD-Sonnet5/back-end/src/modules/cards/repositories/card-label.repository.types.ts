import { CardLabel } from "../entities/card-label.entity";
import { LabelColor } from "../../labels/entities/label.entity";

export interface CreateCardLabelData {
  cardId: string;
  labelId: string;
}

export interface LabelInfo {
  id: string;
  name: string;
  color: LabelColor;
}

export interface CardLabelRepository {
  create(data: CreateCardLabelData): Promise<CardLabel>;
  delete(cardId: string, labelId: string): Promise<boolean>;
  findAllByCardIds(cardIds: string[]): Promise<Record<string, LabelInfo[]>>;
  filterCardIdsByLabels(cardIds: string[], labelIds: string[]): Promise<Set<string>>;
}
