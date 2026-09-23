import { Repository } from "typeorm";
import { Board } from "../entities/Board";

export class BoardService {
  constructor(private boardRepository: Repository<Board>) {}

  async createBoard(userId: string, title: string, description?: string, color?: string): Promise<Board> {
    if (!title.trim()) {
      throw new Error("Board title is required");
    }

    const boardData: any = {
      title,
      userId,
      color: color || "#3B82F6",
    };

    if (description !== undefined) {
      boardData.description = description;
    }

    const board = this.boardRepository.create(boardData);
    return this.boardRepository.save(board) as unknown as Promise<Board>;
  }

  async getBoardsByUser(userId: string): Promise<Board[]> {
    return this.boardRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async getBoardById(boardId: string, userId: string): Promise<Board | null> {
    return this.boardRepository.findOne({
      where: { id: boardId, userId },
    });
  }

  async updateBoard(boardId: string, userId: string, data: { title?: string; description?: string; color?: string }): Promise<Board> {
    const board = await this.getBoardById(boardId, userId);
    if (!board) {
      throw new Error("Board not found");
    }

    if (data.title !== undefined) {
      if (!data.title.trim()) {
        throw new Error("Board title is required");
      }
      board.title = data.title;
    }

    if (data.description !== undefined) {
      board.description = data.description;
    }

    if (data.color !== undefined) {
      board.color = data.color;
    }

    return this.boardRepository.save(board);
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.getBoardById(boardId, userId);
    if (!board) {
      throw new Error("Board not found");
    }

    await this.boardRepository.remove(board);
  }
}
