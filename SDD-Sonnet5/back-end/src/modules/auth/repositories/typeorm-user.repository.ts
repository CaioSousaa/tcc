import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserData, UserRepository } from "./repository.types";

export class TypeOrmUserRepository implements UserRepository {
  constructor(private readonly repo: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async create(data: CreateUserData): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }
}
