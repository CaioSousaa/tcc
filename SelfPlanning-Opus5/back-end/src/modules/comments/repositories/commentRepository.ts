import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { Comment } from "../entities/Comment";

export function commentRepository(): Repository<Comment> {
  return AppDataSource.getRepository(Comment);
}
