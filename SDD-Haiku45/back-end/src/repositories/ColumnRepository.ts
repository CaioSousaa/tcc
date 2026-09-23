import { Repository } from "typeorm";
import { BoardColumn } from "../entities/Column";
import { AppDataSource } from "../database";

export class ColumnRepository {
  private repo: Repository<BoardColumn>;

  constructor() {
    this.repo = AppDataSource.getRepository(BoardColumn);
  }

  async insert(column: Partial<BoardColumn>): Promise<BoardColumn> {
    const newColumn = this.repo.create(column);
    return this.repo.save(newColumn);
  }

  async insertMany(columns: Partial<BoardColumn>[]): Promise<BoardColumn[]> {
    const newColumns = this.repo.create(columns);
    return this.repo.save(newColumns);
  }

  async findById(columnId: string, boardId: string): Promise<BoardColumn | null> {
    return this.repo.findOne({
      where: { id: columnId, board_id: boardId },
    });
  }

  async findByIdOnly(columnId: string): Promise<BoardColumn | null> {
    return this.repo.findOne({
      where: { id: columnId },
    });
  }

  async findByBoard(boardId: string): Promise<BoardColumn[]> {
    return this.repo.find({
      where: { board_id: boardId },
      order: { position: "ASC" },
    });
  }

  async countByBoard(boardId: string): Promise<number> {
    return this.repo.count({ where: { board_id: boardId } });
  }

  async update(
    columnId: string,
    boardId: string,
    data: Partial<BoardColumn>
  ): Promise<void> {
    await this.repo.update(
      { id: columnId, board_id: boardId },
      data
    );
  }

  async delete(columnId: string, boardId: string): Promise<void> {
    await this.repo.delete({ id: columnId, board_id: boardId });
  }

  async deleteByBoard(boardId: string): Promise<void> {
    await this.repo.delete({ board_id: boardId });
  }

  async checkNameDuplicate(
    boardId: string,
    name: string,
    excludeColumnId?: string
  ): Promise<boolean> {
    const query = this.repo
      .createQueryBuilder()
      .where("board_id = :boardId", { boardId })
      .andWhere("name = :name", { name });

    if (excludeColumnId) {
      query.andWhere("id != :excludeColumnId", { excludeColumnId });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async updatePositions(
    boardId: string,
    columnsData: Array<{ id: string; position: number }>
  ): Promise<void> {
    for (const { id, position } of columnsData) {
      await this.repo.update(
        { id, board_id: boardId },
        { position }
      );
    }
  }
}
