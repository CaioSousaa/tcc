import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { BoardList } from "../entities/BoardList";

export function listRepository(): Repository<BoardList> {
  return AppDataSource.getRepository(BoardList);
}
