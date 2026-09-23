import { Repository } from "typeorm";
import { List } from "../entities/List";
import { BoardService } from "./BoardService";
import { Board } from "../entities/Board";

export class ListService {
  constructor(
    private listRepository: Repository<List>,
    private boardRepository: Repository<Board>
  ) {}

  async createList(boardId: string, userId: string, title: string): Promise<List> {
    const boardRepo = this.boardRepository;
    const board = await boardRepo.findOne({ where: { id: boardId, userId } });
    if (!board) {
      throw new Error("Board not found");
    }

    if (!title.trim()) {
      throw new Error("List title is required");
    }

    const lists = await this.listRepository.find({ where: { boardId }, order: { position: "DESC" } });
    const nextPosition = lists.length > 0 && lists[0] ? lists[0].position + 1 : 0;

    const list = this.listRepository.create({
      title,
      boardId,
      position: nextPosition,
    });

    return this.listRepository.save(list) as unknown as Promise<List>;
  }

  async getListsByBoard(boardId: string, userId: string): Promise<List[]> {
    const board = await this.boardRepository.findOne({ where: { id: boardId, userId } });
    if (!board) {
      throw new Error("Board not found");
    }

    return this.listRepository.find({
      where: { boardId },
      order: { position: "ASC" },
    });
  }

  async getListById(listId: string, userId: string): Promise<List | null> {
    const list = await this.listRepository.findOne({
      where: { id: listId },
      relations: { board: true },
    });

    if (!list || list.board.userId !== userId) {
      return null;
    }

    return list;
  }

  async updateListTitle(listId: string, userId: string, title: string): Promise<List> {
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("List not found");
    }

    if (!title.trim()) {
      throw new Error("List title is required");
    }

    list.title = title;
    return this.listRepository.save(list);
  }

  async reorderList(listId: string, userId: string, newPosition: number): Promise<List> {
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("List not found");
    }

    const allLists = await this.listRepository.find({
      where: { boardId: list.boardId },
      order: { position: "ASC" },
    });

    const oldPosition = list.position;
    if (newPosition >= allLists.length) {
      throw new Error("Invalid position");
    }

    if (oldPosition < newPosition) {
      for (const l of allLists) {
        if (l.position > oldPosition && l.position <= newPosition) {
          l.position -= 1;
          await this.listRepository.save(l);
        }
      }
    } else if (oldPosition > newPosition) {
      for (const l of allLists) {
        if (l.position >= newPosition && l.position < oldPosition) {
          l.position += 1;
          await this.listRepository.save(l);
        }
      }
    }

    list.position = newPosition;
    return this.listRepository.save(list);
  }

  async deleteList(listId: string, userId: string): Promise<void> {
    const list = await this.getListById(listId, userId);
    if (!list) {
      throw new Error("List not found");
    }

    const allLists = await this.listRepository.find({
      where: { boardId: list.boardId },
      order: { position: "ASC" },
    });

    for (const l of allLists) {
      if (l.position > list.position) {
        l.position -= 1;
        await this.listRepository.save(l);
      }
    }

    await this.listRepository.remove(list);
  }
}
