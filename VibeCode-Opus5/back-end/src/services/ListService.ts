import type { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { List } from "../entities/List";
import type {
  CreateListInput,
  DeleteListInput,
  ReorderListsInput,
  UpdateListInput,
} from "../schemas/list.schema";
import { AppError } from "../utils/AppError";
import { boardService } from "./BoardService";
import { cardService } from "./CardService";

export interface PublicList {
  id: string;
  title: string;
  position: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}

function toPublicList(list: List): PublicList {
  return {
    id: list.id,
    title: list.title,
    position: list.position,
    boardId: list.boardId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class ListService {
  private get lists() {
    return AppDataSource.getRepository(List);
  }

  async list(ownerId: string, boardId: string): Promise<PublicList[]> {
    await boardService.requireAdmin(ownerId, boardId);

    const lists = await this.lists.find({
      where: { boardId },
      order: { position: "ASC" },
    });

    return lists.map(toPublicList);
  }

  async create(
    ownerId: string,
    boardId: string,
    input: CreateListInput,
  ): Promise<PublicList> {
    await boardService.requireAdmin(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      const total = await manager.count(List, { where: { boardId } });
      const position = clamp(input.position ?? total, 0, total);

      await this.shiftPositions(manager, boardId, position, total - 1, 1);

      const created = manager.create(List, {
        title: input.title,
        position,
        boardId,
      });

      await manager.save(created);

      return toPublicList(created);
    });
  }

  async update(
    ownerId: string,
    boardId: string,
    listId: string,
    input: UpdateListInput,
  ): Promise<PublicList> {
    await boardService.requireAdmin(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      const list = await this.getBoardList(manager, boardId, listId);

      if (input.title !== undefined) {
        list.title = input.title;
      }

      if (input.position !== undefined) {
        const total = await manager.count(List, { where: { boardId } });
        const target = clamp(input.position, 0, total - 1);

        if (target !== list.position) {
          if (target < list.position) {
            await this.shiftPositions(
              manager,
              boardId,
              target,
              list.position - 1,
              1,
            );
          } else {
            await this.shiftPositions(
              manager,
              boardId,
              list.position + 1,
              target,
              -1,
            );
          }

          list.position = target;
        }
      }

      await manager.save(list);

      return toPublicList(list);
    });
  }

  async reorder(
    ownerId: string,
    boardId: string,
    input: ReorderListsInput,
  ): Promise<PublicList[]> {
    await boardService.requireAdmin(ownerId, boardId);

    return AppDataSource.transaction(async (manager) => {
      const lists = await manager.find(List, { where: { boardId } });
      const currentIds = new Set(lists.map((list) => list.id));
      const requestedIds = new Set(input.listIds);

      const sameLength =
        input.listIds.length === lists.length &&
        requestedIds.size === input.listIds.length;
      const sameIds =
        sameLength && input.listIds.every((id) => currentIds.has(id));

      if (!sameIds) {
        throw new AppError(
          "A nova ordem deve conter exatamente as listas do quadro.",
          422,
          { listIds: "A nova ordem deve conter exatamente as listas do quadro." },
        );
      }

      const byId = new Map(lists.map((list) => [list.id, list]));
      const reordered = input.listIds.map((id, index) => {
        const list = byId.get(id)!;
        list.position = index;

        return list;
      });

      // Two passes: temporary negative slots first, so no intermediate state
      // collides if a unique index is added to (board_id, position) later.
      await Promise.all(
        reordered.map((list, index) =>
          manager.update(List, { id: list.id }, { position: -(index + 1) }),
        ),
      );

      await Promise.all(
        reordered.map((list) =>
          manager.update(List, { id: list.id }, { position: list.position }),
        ),
      );

      return reordered.map(toPublicList);
    });
  }

  async remove(
    ownerId: string,
    boardId: string,
    listId: string,
    input: DeleteListInput,
  ): Promise<void> {
    await boardService.requireAdmin(ownerId, boardId);

    await AppDataSource.transaction(async (manager) => {
      const list = await this.getBoardList(manager, boardId, listId);

      if (input.mode === "move") {
        if (input.targetListId === listId) {
          throw new AppError(
            "Escolha uma lista diferente para mover os cards.",
            422,
            {
              targetListId: "Escolha uma lista diferente para mover os cards.",
            },
          );
        }

        await this.getBoardList(manager, boardId, input.targetListId);
        await cardService.reassignList(manager, listId, input.targetListId);
      }

      const removedPosition = list.position;

      await manager.remove(list);
      await this.shiftPositions(manager, boardId, removedPosition + 1, undefined, -1);
    });
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

  /** Adds `delta` to every position inside the inclusive [from, to] range. */
  private async shiftPositions(
    manager: EntityManager,
    boardId: string,
    from: number,
    to: number | undefined,
    delta: number,
  ): Promise<void> {
    if (to !== undefined && from > to) {
      return;
    }

    const qb = manager
      .createQueryBuilder()
      .update(List)
      .set({ position: () => `"position" + ${delta}` })
      .where("board_id = :boardId", { boardId })
      .andWhere("position >= :from", { from });

    if (to !== undefined) {
      qb.andWhere("position <= :to", { to });
    }

    await qb.execute();
  }
}

export const listService = new ListService();
