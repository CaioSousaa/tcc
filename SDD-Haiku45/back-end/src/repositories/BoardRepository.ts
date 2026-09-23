import { Repository } from "typeorm";
import { Board } from "../entities/Board";
import { AppDataSource } from "../database";

export class BoardRepository {
  private repo: Repository<Board>;

  constructor() {
    this.repo = AppDataSource.getRepository(Board);
  }

  async insert(board: Partial<Board>): Promise<Board> {
    const newBoard = this.repo.create(board);
    return this.repo.save(newBoard);
  }

  async findById(boardId: string, userId: string): Promise<Board | null> {
    return this.repo.findOne({
      where: { id: boardId, user_id: userId },
      relations: { columns: true },
    });
  }

  async findByUser(userId: string): Promise<Board[]> {
    return this.repo.find({
      where: { user_id: userId },
      relations: { columns: true },
      order: { created_at: "DESC" },
    });
  }

  async update(
    boardId: string,
    userId: string,
    data: Partial<Board>
  ): Promise<void> {
    await this.repo.update(
      { id: boardId, user_id: userId },
      data
    );
  }

  async delete(boardId: string, userId: string): Promise<void> {
    await this.repo.delete({ id: boardId, user_id: userId });
  }

  async findByIdOnly(boardId: string): Promise<Board | null> {
    return this.repo.findOne({
      where: { id: boardId },
    });
  }

  async checkNameDuplicate(userId: string, name: string, excludeBoardId?: string): Promise<boolean> {
    const query = this.repo.createQueryBuilder()
      .where("user_id = :userId", { userId })
      .andWhere("name = :name", { name });

    if (excludeBoardId) {
      query.andWhere("id != :excludeBoardId", { excludeBoardId });
    }

    const result = await query.getCount();
    return result > 0;
  }
}
