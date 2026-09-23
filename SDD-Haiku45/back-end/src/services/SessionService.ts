import { v4 as uuidv4 } from "uuid";
import { SessionRepository } from "../repositories/SessionRepository";
import { Session } from "../entities/Session";

const SESSION_MAX_AGE_HOURS = 24;

export class SessionService {
  private sessionRepository: SessionRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
  }

  async createSession(userId: string): Promise<Session> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_HOURS * 60 * 60 * 1000);

    return this.sessionRepository.insert({
      id: uuidv4(),
      user_id: userId,
      created_at: now,
      last_activity_at: now,
      expires_at: expiresAt,
      status: "active",
    });
  }

  async validateSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      return null;
    }

    if (session.status === "invalidated") {
      return null;
    }

    const now = new Date();
    if (session.expires_at < now) {
      return null;
    }

    return session;
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionRepository.invalidate(sessionId);
  }

  async renewActivityTime(sessionId: string): Promise<void> {
    await this.sessionRepository.updateActivity(sessionId, new Date());
  }

  async invalidateUserPreviousSessions(userId: string): Promise<void> {
    const sessions = await this.sessionRepository.findUserSessions(userId);
    for (const session of sessions) {
      await this.invalidateSession(session.id);
    }
  }
}
