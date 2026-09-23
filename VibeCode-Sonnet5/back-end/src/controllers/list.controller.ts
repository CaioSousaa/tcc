import { Request, Response } from "express";
import { AppDataSource } from "../utils/data-source";
import {
  findAccessibleBoard,
  findAdminList,
  requireBoardAdmin,
} from "../utils/ownership";
import { List } from "../entities/List";
import { Card } from "../entities/Card";

const MAX_TITLE_LENGTH = 120;

function toListResponse(list: List) {
  return {
    id: list.id,
    title: list.title,
    position: list.position,
    boardId: list.boardId,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

export async function listLists(req: Request, res: Response): Promise<void> {
  const board = await findAccessibleBoard(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!board) {
    res.status(404).json({ error: "Quadro não encontrado." });
    return;
  }

  const listRepository = AppDataSource.getRepository(List);
  const lists = await listRepository.find({
    where: { boardId: board.id },
    order: { position: "ASC" },
  });

  res.status(200).json({ lists: lists.map(toListResponse) });
}

export async function createList(req: Request, res: Response): Promise<void> {
  const { title } = req.body as { title?: string };

  if (!title?.trim()) {
    res.status(400).json({ error: "Nome da lista é obrigatório." });
    return;
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Nome da lista deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const listRepository = AppDataSource.getRepository(List);
  const { maxPosition } = (await listRepository
    .createQueryBuilder("list")
    .select("MAX(list.position)", "maxPosition")
    .where("list.board_id = :boardId", { boardId: board.id })
    .getRawOne()) as { maxPosition: number | null };

  const list = listRepository.create({
    title: title.trim(),
    position: (maxPosition ?? -1) + 1,
    boardId: board.id,
  });
  await listRepository.save(list);

  res.status(201).json({ list: toListResponse(list) });
}

export async function renameList(req: Request, res: Response): Promise<void> {
  const { title } = req.body as { title?: string };

  if (!title?.trim()) {
    res.status(400).json({ error: "Nome da lista é obrigatório." });
    return;
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    res
      .status(400)
      .json({ error: `Nome da lista deve ter no máximo ${MAX_TITLE_LENGTH} caracteres.` });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const listRepository = AppDataSource.getRepository(List);
  const list = await listRepository.findOne({
    where: { id: req.params.id as string, boardId: board.id },
  });
  if (!list) {
    res.status(404).json({ error: "Lista não encontrada." });
    return;
  }

  list.title = title.trim();
  await listRepository.save(list);

  res.status(200).json({ list: toListResponse(list) });
}

export async function reorderLists(req: Request, res: Response): Promise<void> {
  const { orderedListIds } = req.body as { orderedListIds?: string[] };

  if (!Array.isArray(orderedListIds) || orderedListIds.length === 0) {
    res.status(400).json({ error: "Lista de ids inválida." });
    return;
  }

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const listRepository = AppDataSource.getRepository(List);
  const lists = await listRepository.find({ where: { boardId: board.id } });

  const currentIds = new Set(lists.map((list) => list.id));
  const providedIds = new Set(orderedListIds);
  const sameSet =
    currentIds.size === providedIds.size &&
    [...currentIds].every((id) => providedIds.has(id));

  if (!sameSet) {
    res
      .status(400)
      .json({ error: "A lista de ids não corresponde às listas do quadro." });
    return;
  }

  const listsById = new Map(lists.map((list) => [list.id, list]));
  await AppDataSource.transaction(async (manager) => {
    await Promise.all(
      orderedListIds.map((id, index) => {
        const list = listsById.get(id) as List;
        list.position = index;
        return manager.save(list);
      }),
    );
  });

  const updated = await listRepository.find({
    where: { boardId: board.id },
    order: { position: "ASC" },
  });

  res.status(200).json({ lists: updated.map(toListResponse) });
}

async function reindexLists(boardId: string): Promise<void> {
  const listRepository = AppDataSource.getRepository(List);
  const remaining = await listRepository.find({
    where: { boardId },
    order: { position: "ASC" },
  });
  await Promise.all(
    remaining.map((item, index) => {
      if (item.position === index) return Promise.resolve();
      item.position = index;
      return listRepository.save(item);
    }),
  );
}

export async function deleteList(req: Request, res: Response): Promise<void> {
  const { strategy, targetListId } = req.body as {
    strategy?: "move" | "delete";
    targetListId?: string;
  };

  const access = await requireBoardAdmin(
    req.params.boardId as string,
    req.userId as string,
  );
  if (!access.ok) {
    res.status(access.status).json({ error: access.error });
    return;
  }
  const board = access.board;

  const listRepository = AppDataSource.getRepository(List);
  const list = await listRepository.findOne({
    where: { id: req.params.id as string, boardId: board.id },
  });
  if (!list) {
    res.status(404).json({ error: "Lista não encontrada." });
    return;
  }

  const cardRepository = AppDataSource.getRepository(Card);
  const cardCount = await cardRepository.count({
    where: { listId: list.id },
  });

  if (cardCount > 0) {
    if (strategy !== "move" && strategy !== "delete") {
      res.status(400).json({
        error: "Informe o que deve acontecer com os cards desta lista.",
        cardCount,
      });
      return;
    }

    if (strategy === "move") {
      if (!targetListId || targetListId === list.id) {
        res.status(400).json({ error: "Lista de destino inválida." });
        return;
      }

      const targetList = await findAdminList(
        board.id,
        targetListId,
        req.userId as string,
      );
      if (!targetList) {
        res.status(400).json({ error: "Lista de destino inválida." });
        return;
      }

      await AppDataSource.transaction(async (manager) => {
        const cardManager = manager.getRepository(Card);

        const cardsToMove = await cardManager.find({
          where: { listId: list.id },
          order: { position: "ASC" },
        });
        const targetCards = await cardManager.find({
          where: { listId: targetList.id },
          order: { position: "ASC" },
        });

        let nextPosition = targetCards.length;
        await Promise.all(
          cardsToMove.map((card) => {
            card.listId = targetList.id;
            card.position = nextPosition++;
            return cardManager.save(card);
          }),
        );

        await manager.getRepository(List).remove(list);
      });
    } else {
      await listRepository.remove(list);
    }
  } else {
    await listRepository.remove(list);
  }

  await reindexLists(board.id);

  res.status(204).send();
}
