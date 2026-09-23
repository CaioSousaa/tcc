import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { Board } from "../entities/Board";

export function boardRepository(): Repository<Board> {
  return AppDataSource.getRepository(Board);
}
