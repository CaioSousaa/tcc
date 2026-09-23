import { Repository, LessThan, MoreThan, IsNull } from "typeorm";
import { Invitation } from "../entities/Invitation";
import { AppDataSource } from "../database";

export class InvitationRepository {
  private repo: Repository<Invitation>;

  constructor() {
    this.repo = AppDataSource.getRepository(Invitation);
  }

  async insert(invitation: Partial<Invitation>): Promise<Invitation> {
    const newInvitation = this.repo.create(invitation);
    return this.repo.save(newInvitation);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.repo.findOne({
      where: { token },
      relations: { board: true },
    });
  }

  async findById(invitationId: string): Promise<Invitation | null> {
    return this.repo.findOne({
      where: { id: invitationId },
      relations: { board: true },
    });
  }

  async findActiveByBoardAndEmail(
    boardId: string,
    email: string
  ): Promise<Invitation | null> {
    const now = new Date();
    return this.repo.findOne({
      where: {
        board_id: boardId,
        email: email.toLowerCase(),
        expires_at: MoreThan(now),
        accepted_at: IsNull(),
      },
    });
  }

  async findByBoardId(boardId: string): Promise<Invitation[]> {
    return this.repo.find({
      where: { board_id: boardId },
      order: { created_at: "DESC" },
    });
  }

  async findPendingByBoard(boardId: string): Promise<Invitation[]> {
    const now = new Date();
    return this.repo.find({
      where: {
        board_id: boardId,
        expires_at: MoreThan(now),
        accepted_at: IsNull(),
      },
      order: { created_at: "DESC" },
    });
  }

  async update(invitationId: string, data: Partial<Invitation>): Promise<void> {
    await this.repo.update({ id: invitationId }, data);
  }

  async delete(invitationId: string): Promise<void> {
    await this.repo.delete({ id: invitationId });
  }

  async deleteExpired(olderThan: Date): Promise<void> {
    await this.repo.delete({
      expires_at: LessThan(olderThan),
      accepted_at: IsNull(),
    });
  }

  async findByEmail(email: string): Promise<Invitation[]> {
    return this.repo.find({
      where: { email: email.toLowerCase() },
      relations: { board: true },
    });
  }
}
