import { Repository } from "typeorm";
import { RefreshToken } from "../entities/refresh-token.entity";
import {
  CreateRefreshTokenData,
  RefreshTokenRepository,
  RefreshTokenWithUser,
} from "./repository.types";

export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly repo: Repository<RefreshToken>) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const refreshToken = this.repo.create({ ...data, revokedAt: null, userAgent: null });
    return this.repo.save(refreshToken);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenWithUser | null> {
    const found = await this.repo.findOne({
      where: { tokenHash },
      relations: { user: true },
    });
    return found as RefreshTokenWithUser | null;
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update({ id }, { revokedAt: new Date() });
  }
}
