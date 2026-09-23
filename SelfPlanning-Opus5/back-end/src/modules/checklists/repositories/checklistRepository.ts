import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { ChecklistItem } from "../entities/ChecklistItem";

export function checklistRepository(): Repository<ChecklistItem> {
  return AppDataSource.getRepository(ChecklistItem);
}
