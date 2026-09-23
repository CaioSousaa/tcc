import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { Card } from "../entities/Card";

export function cardRepository(): Repository<Card> {
  return AppDataSource.getRepository(Card);
}
