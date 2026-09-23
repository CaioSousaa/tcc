import { Repository } from "typeorm";
import { List } from "../entities/list.entity";
import { CreateListData, ListRepository, UpdateListData } from "./repository.types";

export class TypeOrmListRepository implements ListRepository {
  constructor(private readonly repo: Repository<List>) {}

  async findAllByBoard(boardId: string): Promise<List[]> {
    return this.repo.find({ where: { boardId }, order: { position: "ASC" } });
  }

  async findByIdAndBoard(id: string, boardId: string): Promise<List | null> {
    return this.repo.findOne({ where: { id, boardId } });
  }

  async countByBoard(boardId: string): Promise<number> {
    return this.repo.count({ where: { boardId } });
  }

  async create(data: CreateListData): Promise<List> {
    return this.repo.manager.transaction(async (manager) => {
      const listRepo = manager.getRepository(List);
      const total = await listRepo.count({ where: { boardId: data.boardId } });
      const list = listRepo.create({ name: data.name, boardId: data.boardId, position: total });
      return listRepo.save(list);
    });
  }

  async update(id: string, boardId: string, data: UpdateListData): Promise<List | null> {
    return this.repo.manager.transaction(async (manager) => {
      const listRepo = manager.getRepository(List);
      const current = await listRepo.findOne({ where: { id, boardId } });
      if (!current) {
        return null;
      }

      if (data.name !== undefined) {
        current.name = data.name;
      }

      if (data.position !== undefined && data.position !== current.position) {
        const siblings = await listRepo.find({ where: { boardId }, order: { position: "ASC" } });
        const withoutCurrent = siblings.filter((l) => l.id !== id);
        withoutCurrent.splice(data.position, 0, current);

        for (const [index, item] of withoutCurrent.entries()) {
          if (item.position !== index) {
            item.position = index;
            if (item.id !== current.id) {
              await listRepo.save(item);
            }
          }
        }
      }

      return listRepo.save(current);
    });
  }

  async delete(id: string, boardId: string): Promise<boolean> {
    return this.repo.manager.transaction(async (manager) => {
      const listRepo = manager.getRepository(List);
      const result = await listRepo.delete({ id, boardId });
      if (!result.affected) {
        return false;
      }

      const remaining = await listRepo.find({ where: { boardId }, order: { position: "ASC" } });
      for (const [index, item] of remaining.entries()) {
        if (item.position !== index) {
          item.position = index;
          await listRepo.save(item);
        }
      }

      return true;
    });
  }
}
