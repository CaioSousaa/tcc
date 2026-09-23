import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Card } from "../entities/Card";
import { List } from "../entities/List";
import type { CreateCardInput, UpdateCardInput } from "../schemas/card.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicCard {
  id: string;
  title: string;
  description: string | null;
  position: number;
  listId: string;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicCard(card: Card): PublicCard {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    position: card.position,
    listId: card.listId,
    dueDate: card.dueDate,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class CardService {
  private get cards() {
    return AppDataSource.getRepository(Card);
  }

  async list(ownerId: string, boardId: string): Promise<PublicCard[]> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    const cards = await this.cards
      .createQueryBuilder("card")
      .innerJoin(List, "list", "list.id = card.list_id")
      .where("list.board_id = :boardId", { boardId })
      .orderBy("card.position", "ASC")
      .getMany();

    return cards.map(toPublicCard);
  }

  async create(
    ownerId: string,
    boardId: string,
    input: CreateCardInput,
  ): Promise<PublicCard> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      await this.getBoardList(manager, boardId, input.listId);

      const total = await manager.count(Card, {
        where: { listId: input.listId },
      });
      const position = clamp(input.position ?? total, 0, total);

      await this.shiftPositions(manager, input.listId, position, total - 1, 1);

      const created = manager.create(Card, {
        title: input.title,
        description: input.description ?? null,
        position,
        listId: input.listId,
        dueDate: input.dueDate ?? null,
      });

      await manager.save(created);

      return toPublicCard(created);
    });
  }

  async update(
    ownerId: string,
    boardId: string,
    cardId: string,
    input: UpdateCardInput,
  ): Promise<PublicCard> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      const card = await this.getBoardCard(manager, boardId, cardId);

      if (input.title !== undefined) {
        card.title = input.title;
      }

      if (input.description !== undefined) {
        card.description = input.description;
      }

      if (input.dueDate !== undefined) {
        card.dueDate = input.dueDate;
      }

      const targetListId = input.listId ?? card.listId;
      const isMovingList = targetListId !== card.listId;

      if (isMovingList) {
        await this.getBoardList(manager, boardId, targetListId);
      }

      if (isMovingList || input.position !== undefined) {
        const total = await manager.count(Card, {
          where: { listId: targetListId },
        });
        const maxIndex = isMovingList ? total : total - 1;
        const target = clamp(input.position ?? maxIndex, 0, maxIndex);

        if (!isMovingList) {
          if (target !== card.position) {
            if (target < card.position) {
              await this.shiftPositions(
                manager,
                card.listId,
                target,
                card.position - 1,
                1,
              );
            } else {
              await this.shiftPositions(
                manager,
                card.listId,
                card.position + 1,
                target,
                -1,
              );
            }

            card.position = target;
          }
        } else {
          await this.shiftPositions(
            manager,
            card.listId,
            card.position + 1,
            undefined,
            -1,
          );
          await this.shiftPositions(manager, targetListId, target, undefined, 1);

          card.listId = targetListId;
          card.position = target;
        }
      }

      await manager.save(card);

      return toPublicCard(card);
    });
  }

  async remove(
    ownerId: string,
    boardId: string,
    cardId: string,
  ): Promise<void> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    await AppDataSource.transaction(async (manager) => {
      const card = await this.getBoardCard(manager, boardId, cardId);
      const { listId, position } = card;

      await manager.remove(card);
      await this.shiftPositions(manager, listId, position + 1, undefined, -1);
    });
  }

  /** Appends every card of `sourceListId` to the end of `targetListId`. */
  async reassignList(
    manager: EntityManager,
    sourceListId: string,
    targetListId: string,
  ): Promise<void> {
    const total = await manager.count(Card, { where: { listId: targetListId } });

    await manager
      .createQueryBuilder()
      .update(Card)
      .set({ listId: targetListId, position: () => `"position" + ${total}` })
      .where("list_id = :sourceListId", { sourceListId })
      .execute();
  }

  private async getBoardList(
    manager: EntityManager,
    boardId: string,
    listId: string,
  ): Promise<List> {
    const list = await manager.findOne(List, { where: { id: listId } });

    if (!list || list.boardId !== boardId) {
      throw new AppError("Lista não encontrada.", 404);
    }

    return list;
  }

  private async getBoardCard(
    manager: EntityManager,
    boardId: string,
    cardId: string,
  ): Promise<Card> {
    const card = await manager.findOne(Card, { where: { id: cardId } });

    if (!card) {
      throw new AppError("Card não encontrado.", 404);
    }

    await this.getBoardList(manager, boardId, card.listId);

    return card;
  }

  /** Adds `delta` to every position inside the inclusive [from, to] range of one list. */
  private async shiftPositions(
    manager: EntityManager,
    listId: string,
    from: number,
    to: number | undefined,
    delta: number,
  ): Promise<void> {
    if (to !== undefined && from > to) {
      return;
    }

    const qb = manager
      .createQueryBuilder()
      .update(Card)
      .set({ position: () => `"position" + ${delta}` })
      .where("list_id = :listId", { listId })
      .andWhere("position >= :from", { from });

    if (to !== undefined) {
      qb.andWhere("position <= :to", { to });
    }

    await qb.execute();
  }
}

export const cardService = new CardService();
