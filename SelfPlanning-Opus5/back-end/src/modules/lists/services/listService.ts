import { EntityManager } from "typeorm";
import { AppDataSource } from "../../../database/data-source";
import { AppError } from "../../../shared/errors/AppError";
import { requireBoardAccess, requireBoardAdmin } from "../../boards/services/boardService";
import { CardsByList } from "../../cards/cardView";
import { Card } from "../../cards/entities/Card";
import { countCardsByList, groupCardsByBoard } from "../../cards/services/cardGrouping";
import { BoardList } from "../entities/BoardList";
import { BoardListView, toBoardListView } from "../listView";
import { CardStrategy } from "../listValidation";
import { listRepository } from "../repositories/listRepository";

export interface CreateListRequest {
  boardId: string;
  userId: string;
  name: string;
}

export interface RenameListRequest extends CreateListRequest {
  listId: string;
}

export interface MoveListRequest {
  boardId: string;
  userId: string;
  listId: string;
  position: number;
}

export interface DeleteListRequest {
  boardId: string;
  userId: string;
  listId: string;
  strategy: CardStrategy | null;
  targetListId: string | null;
}

export interface DeleteListResult {
  lists: BoardListView[];
  cards: CardsByList;
}

async function findOrderedLists(
  boardId: string,
  manager: EntityManager = AppDataSource.manager
): Promise<BoardList[]> {
  return manager.getRepository(BoardList).find({
    where: { boardId },
    order: { position: "ASC" },
  });
}

async function toViewsWithCounts(
  lists: BoardList[],
  manager: EntityManager = AppDataSource.manager
): Promise<BoardListView[]> {
  const counts = await countCardsByList(
    lists.map((list) => list.id),
    manager
  );

  return lists.map((list) => toBoardListView(list, counts.get(list.id) ?? 0));
}

export async function findOwnedList(
  listId: string,
  boardId: string,
  userId: string
): Promise<BoardList> {
  await requireBoardAccess(boardId, userId);

  const list = await listRepository().findOne({ where: { id: listId } });

  if (!list || list.boardId !== boardId) {
    throw new AppError("Lista não encontrada", 404);
  }

  return list;
}

/** Regrava as posições em sequência para que nunca haja buraco na numeração. */
async function persistOrder(
  lists: BoardList[],
  manager: EntityManager = AppDataSource.manager
): Promise<void> {
  const reordered = lists.map((list, index) => {
    list.position = index;

    return list;
  });

  await manager.getRepository(BoardList).save(reordered);
}

export async function createList(data: CreateListRequest): Promise<BoardListView> {
  await requireBoardAdmin(data.boardId, data.userId);

  const repository = listRepository();
  const total = await repository.count({ where: { boardId: data.boardId } });

  const list = repository.create({
    name: data.name,
    position: total,
    boardId: data.boardId,
  });

  await repository.save(list);

  return toBoardListView(list, 0);
}

export async function listLists(boardId: string, userId: string): Promise<BoardListView[]> {
  await requireBoardAccess(boardId, userId);

  return toViewsWithCounts(await findOrderedLists(boardId));
}

export async function renameList(data: RenameListRequest): Promise<BoardListView> {
  await requireBoardAdmin(data.boardId, data.userId);

  const list = await findOwnedList(data.listId, data.boardId, data.userId);

  list.name = data.name;

  await listRepository().save(list);

  return (await toViewsWithCounts([list]))[0] as BoardListView;
}

export async function moveList(data: MoveListRequest): Promise<BoardListView[]> {
  await requireBoardAdmin(data.boardId, data.userId);

  const list = await findOwnedList(data.listId, data.boardId, data.userId);

  const lists = await findOrderedLists(data.boardId);
  const currentIndex = lists.findIndex((item) => item.id === list.id);
  const targetIndex = Math.min(data.position, lists.length - 1);

  const [moved] = lists.splice(currentIndex, 1);

  if (moved) {
    lists.splice(targetIndex, 0, moved);
  }

  await persistOrder(lists);

  return toViewsWithCounts(lists);
}

async function resolveTargetList(
  data: DeleteListRequest,
  cardCount: number
): Promise<BoardList | null> {
  if (cardCount === 0) {
    return null;
  }

  const board = await requireBoardAdmin(data.boardId, data.userId);

  if (board.blockListDeletionWithCards) {
    throw new AppError(
      "A exclusão está bloqueada enquanto a lista tiver cards, conforme a regra do quadro",
      409
    );
  }

  if (data.strategy === null) {
    throw new AppError("Escolha o que deve acontecer com os cards da lista");
  }

  if (data.strategy === "delete") {
    return null;
  }

  if (data.targetListId === null) {
    throw new AppError("Escolha a lista de destino dos cards");
  }

  if (data.targetListId === data.listId) {
    throw new AppError("A lista de destino deve ser diferente da lista excluída");
  }

  return findOwnedList(data.targetListId, data.boardId, data.userId);
}

export async function deleteList(data: DeleteListRequest): Promise<DeleteListResult> {
  await requireBoardAdmin(data.boardId, data.userId);

  const list = await findOwnedList(data.listId, data.boardId, data.userId);

  const cardCount = await AppDataSource.getRepository(Card).count({
    where: { listId: list.id },
  });

  const targetList = await resolveTargetList(data, cardCount);

  await AppDataSource.transaction(async (manager) => {
    if (targetList) {
      const cardRepository = manager.getRepository(Card);

      const movedCards = await cardRepository.find({
        where: { listId: list.id },
        order: { position: "ASC" },
      });

      const targetCards = await cardRepository.find({
        where: { listId: targetList.id },
        order: { position: "ASC" },
      });

      const reordered = [...targetCards, ...movedCards].map((card, index) => {
        card.listId = targetList.id;
        card.position = index;

        return card;
      });

      await cardRepository.save(reordered);
    }

    await manager.getRepository(BoardList).remove(list);

    await persistOrder(await findOrderedLists(data.boardId, manager), manager);
  });

  const remaining = await findOrderedLists(data.boardId);

  return {
    lists: await toViewsWithCounts(remaining),
    cards: await groupCardsByBoard(data.boardId),
  };
}
