import { CardAssignment } from "../entities/card-assignment.entity";

export interface CreateCardAssignmentData {
  cardId: string;
  userId: string;
  boardId: string;
}

export interface AssigneeInfo {
  userId: string;
  name: string;
  email: string;
}

export interface CardAssignmentRepository {
  create(data: CreateCardAssignmentData): Promise<CardAssignment>;
  exists(cardId: string, userId: string): Promise<boolean>;
  delete(cardId: string, userId: string): Promise<boolean>;
  findAllByCardIds(cardIds: string[]): Promise<Record<string, AssigneeInfo[]>>;
  deleteAllByBoardAndUser(boardId: string, userId: string): Promise<number>;
}
