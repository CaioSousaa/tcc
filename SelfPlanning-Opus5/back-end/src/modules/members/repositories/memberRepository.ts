import { Repository } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { BoardMember } from "../entities/BoardMember";
import { CardAssignee } from "../entities/CardAssignee";

export function memberRepository(): Repository<BoardMember> {
  return AppDataSource.getRepository(BoardMember);
}

export function assigneeRepository(): Repository<CardAssignee> {
  return AppDataSource.getRepository(CardAssignee);
}
