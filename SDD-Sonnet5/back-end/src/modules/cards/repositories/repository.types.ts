import { Card } from "../entities/card.entity";

export interface CreateCardData {
  listId: string;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateCardFields {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface CardRepository {
  create(data: CreateCardData): Promise<Card>;
  findAllByList(listId: string): Promise<Card[]>;
  findByIdAndList(id: string, listId: string): Promise<Card | null>;
  update(id: string, listId: string, data: UpdateCardFields): Promise<Card | null>;
  move(
    id: string,
    fromListId: string,
    toListId: string,
    data: UpdateCardFields,
  ): Promise<Card | null>;
  delete(id: string, listId: string): Promise<boolean>;
  deleteAllByList(listId: string): Promise<number>;
}
