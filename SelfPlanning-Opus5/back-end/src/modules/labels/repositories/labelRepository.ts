import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { CardLabel } from "../entities/CardLabel";
import { Label } from "../entities/Label";

export function labelRepository(): Repository<Label> {
  return AppDataSource.getRepository(Label);
}

export function cardLabelRepository(): Repository<CardLabel> {
  return AppDataSource.getRepository(CardLabel);
}
