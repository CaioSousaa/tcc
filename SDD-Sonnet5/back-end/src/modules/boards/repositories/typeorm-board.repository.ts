import { Repository } from "typeorm";
import { Board } from "../entities/board.entity";
import { BoardMember } from "../entities/board-member.entity";
import { BoardRepository, CreateBoardData, UpdateBoardData } from "./repository.types";

export class TypeOrmBoardRepository implements BoardRepository {
  constructor(private readonly repo: Repository<Board>) {}

  async create(data: CreateBoardData): Promise<Board> {
    const board = this.repo.create({
      name: data.name,
      description: data.description ?? null,
      ownerId: data.ownerId,
    });
    return this.repo.save(board);
  }

  async findAllByMember(userId: string): Promise<Board[]> {
    return this.repo
      .createQueryBuilder("board")
      .innerJoin(BoardMember, "member", "member.board_id = board.id AND member.user_id = :userId", {
        userId,
      })
      .orderBy("board.created_at", "DESC")
      .getMany();
  }

  async findByIdAndMember(id: string, userId: string): Promise<Board | null> {
    return this.repo
      .createQueryBuilder("board")
      .innerJoin(BoardMember, "member", "member.board_id = board.id AND member.user_id = :userId", {
        userId,
      })
      .where("board.id = :id", { id })
      .getOne();
  }

  async updateByIdAndMember(
    id: string,
    userId: string,
    data: UpdateBoardData,
  ): Promise<Board | null> {
    const current = await this.findByIdAndMember(id, userId);
    if (!current) {
      return null;
    }
    if (Object.keys(data).length === 0) {
      return current;
    }

    await this.repo.update({ id }, data);
    return this.repo.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.repo.delete({ id });
    return (result.affected ?? 0) > 0;
  }
}
