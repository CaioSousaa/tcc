import { Repository, LessThan } from "typeorm";
import { Session } from "../entities/Session";
import { AppDataSource } from "../database";

export class SessionRepository {
  private repo: Repository<Session>;

  constructor() {
    this.repo = AppDataSource.getRepository(Session);
  }

  async insert(session: Partial<Session>): Promise<Session> {
    const newSession = this.repo.create(session);
    return this.repo.save(newSession);
  }

  async findById(sessionId: string): Promise<Session | null> {
    return this.repo.findOne({
      where: { id: sessionId },
      relations: { user: true },
    });
  }

  async updateActivity(sessionId: string, timestamp: Date): Promise<void> {
    await this.repo.update({ id: sessionId }, { last_activity_at: timestamp });
  }

  async delete(sessionId: string): Promise<void> {
    await this.repo.delete({ id: sessionId });
  }

  async deleteExpired(olderThan: Date): Promise<number> {
    const result = await this.repo.delete({ expires_at: LessThan(olderThan) });
    return result.affected || 0;
  }

  async findUserSessions(userId: string): Promise<Session[]> {
    return this.repo.find({
      where: { user_id: userId, status: "active" },
    });
  }

  async invalidate(sessionId: string): Promise<void> {
    await this.repo.update({ id: sessionId }, { status: "invalidated" });
  }
}
