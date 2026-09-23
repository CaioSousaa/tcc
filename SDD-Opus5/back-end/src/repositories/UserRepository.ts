import { QueryFailedError, type DataSource, type Repository } from "typeorm";
import { User } from "../entities/User";
import { UniqueConstraintError } from "../errors/AppError";

export type CreateUserData = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string;
};

export type StoredUserWithPassword = StoredUser & { passwordHash: string };

export interface UserRepository {
  findById(id: string): Promise<StoredUser | null>;
  findByEmailWithPassword(email: string): Promise<StoredUserWithPassword | null>;
  existsByEmail(email: string): Promise<boolean>;
  /** Throws UniqueConstraintError when the e-mail is already taken. */
  create(data: CreateUserData): Promise<StoredUser>;
}

const PG_UNIQUE_VIOLATION = "23505";

type PgDriverError = Error & { code?: string; constraint?: string };

function isUniqueViolation(error: unknown): error is QueryFailedError<PgDriverError> {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as Partial<PgDriverError> | undefined;
  return driverError?.code === PG_UNIQUE_VIOLATION;
}

export class TypeOrmUserRepository implements UserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = await this.repository.findOne({
      where: { id },
      select: { id: true, name: true, email: true },
    });
    return user ? { id: user.id, name: user.name, email: user.email } : null;
  }

  async findByEmailWithPassword(email: string): Promise<StoredUserWithPassword | null> {
    const user = await this.repository.findOne({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true },
    });
    return user
      ? { id: user.id, name: user.name, email: user.email, passwordHash: user.passwordHash }
      : null;
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }

  async create(data: CreateUserData): Promise<StoredUser> {
    try {
      await this.repository.insert(data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UniqueConstraintError(error.driverError.constraint);
      }
      throw error;
    }
    return { id: data.id, name: data.name, email: data.email };
  }
}
