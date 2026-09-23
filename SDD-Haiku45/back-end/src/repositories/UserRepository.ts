import { Repository } from "typeorm";
import { User } from "../entities/User";
import { AppDataSource } from "../database";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async insert(user: Partial<User>): Promise<User> {
    const newUser = this.repo.create(user);
    return this.repo.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async updateLastLogin(userId: string, timestamp: Date): Promise<void> {
    await this.repo.update({ id: userId }, { last_login_at: timestamp });
  }

  async findById(userId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id: userId },
    });
  }
}
