import { RefreshToken } from "../entities/refresh-token.entity";
import { User } from "../entities/user.entity";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export type RefreshTokenWithUser = RefreshToken & { user: User };

export interface RefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null>;
  revoke(id: string): Promise<void>;
}
