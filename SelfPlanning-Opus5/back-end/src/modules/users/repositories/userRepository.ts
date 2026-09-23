import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { User } from "../entities/User";

export function userRepository(): Repository<User> {
  return AppDataSource.getRepository(User);
}
