import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Card } from "../entities/Card";
import { ChecklistItem } from "../entities/ChecklistItem";
import { List } from "../entities/List";
import type {
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
} from "../schemas/checklist-item.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";

export interface PublicChecklistItem {
  id: string;
  title: string;
  done: boolean;
  position: number;
  cardId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicChecklistItem(item: ChecklistItem): PublicChecklistItem {
  return {
    id: item.id,
    title: item.title,
    done: item.done,
    position: item.position,
    cardId: item.cardId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class ChecklistItemService {
  private get items() {
    return AppDataSource.getRepository(ChecklistItem);
  }

  async list(ownerId: string, boardId: string): Promise<PublicChecklistItem[]> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    const items = await this.items
      .createQueryBuilder("item")
      .innerJoin(Card, "card", "card.id = item.card_id")
      .innerJoin(List, "list", "list.id = card.list_id")
      .where("list.board_id = :boardId", { boardId })
      .orderBy("item.position", "ASC")
      .getMany();

    return items.map(toPublicChecklistItem);
  }

  async create(
    ownerId: string,
    boardId: string,
    input: CreateChecklistItemInput,
  ): Promise<PublicChecklistItem> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      await this.getBoardCard(manager, boardId, input.cardId);

      const total = await manager.count(ChecklistItem, {
        where: { cardId: input.cardId },
      });
      const position = clamp(input.position ?? total, 0, total);

      await this.shiftPositions(manager, input.cardId, position, total - 1, 1);

      const created = manager.create(ChecklistItem, {
        title: input.title,
        position,
        cardId: input.cardId,
      });

      await manager.save(created);

      return toPublicChecklistItem(created);
    });
  }

  async update(
    ownerId: string,
    boardId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
  ): Promise<PublicChecklistItem> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      const item = await this.getBoardItem(manager, boardId, itemId);

      if (input.title !== undefined) {
        item.title = input.title;
      }

      if (input.done !== undefined) {
        item.done = input.done;
      }

      if (input.position !== undefined) {
        const total = await manager.count(ChecklistItem, {
          where: { cardId: item.cardId },
        });
        const target = clamp(input.position, 0, total - 1);

        if (target !== item.position) {
          if (target < item.position) {
            await this.shiftPositions(
              manager,
              item.cardId,
              target,
              item.position - 1,
              1,
            );
          } else {
            await this.shiftPositions(
              manager,
              item.cardId,
              item.position + 1,
              target,
              -1,
            );
          }

          item.position = target;
        }
      }

      await manager.save(item);

      return toPublicChecklistItem(item);
    });
  }

  async remove(
    ownerId: string,
    boardId: string,
    itemId: string,
  ): Promise<void> {
    await boardService.getAccessibleBoard(ownerId, boardId);

    await AppDataSource.transaction(async (manager) => {
      const item = await this.getBoardItem(manager, boardId, itemId);
      const { cardId, position } = item;

      await manager.remove(item);
      await this.shiftPositions(manager, cardId, position + 1, undefined, -1);
    });
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

    const list = await manager.findOne(List, { where: { id: card.listId } });

    if (!list || list.boardId !== boardId) {
      throw new AppError("Card não encontrado.", 404);
    }

    return card;
  }

  private async getBoardItem(
    manager: EntityManager,
    boardId: string,
    itemId: string,
  ): Promise<ChecklistItem> {
    const item = await manager.findOne(ChecklistItem, {
      where: { id: itemId },
    });

    if (!item) {
      throw new AppError("Item não encontrado.", 404);
    }

    await this.getBoardCard(manager, boardId, item.cardId);

    return item;
  }

  /** Adds `delta` to every position inside the inclusive [from, to] range of one card. */
  private async shiftPositions(
    manager: EntityManager,
    cardId: string,
    from: number,
    to: number | undefined,
    delta: number,
  ): Promise<void> {
    if (to !== undefined && from > to) {
      return;
    }

    const qb = manager
      .createQueryBuilder()
      .update(ChecklistItem)
      .set({ position: () => `"position" + ${delta}` })
      .where("card_id = :cardId", { cardId })
      .andWhere("position >= :from", { from });

    if (to !== undefined) {
      qb.andWhere("position <= :to", { to });
    }

    await qb.execute();
  }
}

export const checklistItemService = new ChecklistItemService();
