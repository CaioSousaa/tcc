import { UniqueConstraintError } from "../../errors/AppError";
import type {
  CreateUserData,
  StoredUser,
  StoredUserWithPassword,
  UserRepository,
} from "../../repositories/UserRepository";

/** Mirrors the database guarantees relevant to RF01: unique e-mail index. */
export class InMemoryUserRepository implements UserRepository {
  readonly rows = new Map<string, StoredUserWithPassword>();

  async findById(id: string): Promise<StoredUser | null> {
    const row = this.rows.get(id);
    return row ? { id: row.id, name: row.name, email: row.email } : null;
  }

  async findByEmailWithPassword(email: string): Promise<StoredUserWithPassword | null> {
    for (const row of this.rows.values()) if (row.email === email) return { ...row };
    return null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.findByEmailWithPassword(email)) !== null;
  }

  async create(data: CreateUserData): Promise<StoredUser> {
    if (await this.existsByEmail(data.email)) throw new UniqueConstraintError("UQ_users_email");
    this.rows.set(data.id, { ...data });
    return { id: data.id, name: data.name, email: data.email };
  }
}
