import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

export const BCRYPT_COST = 10;

/**
 * bcrypt only considers the first 72 bytes of its input. Passwords may have up
 * to 100 characters (RN05), so they are pre-hashed to a fixed 44-char base64
 * digest; otherwise two passwords differing after byte 72 would both match.
 */
function prehash(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("base64");
}

export class PasswordService {
  private readonly cost: number;
  private dummyHash: Promise<string> | undefined;

  constructor(cost: number = BCRYPT_COST) {
    if (!Number.isInteger(cost) || cost < BCRYPT_COST) {
      throw new Error(`bcrypt cost must be an integer >= ${BCRYPT_COST}`);
    }
    this.cost = cost;
  }

  hash(password: string): Promise<string> {
    return bcrypt.hash(prehash(password), this.cost);
  }

  verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(prehash(password), hash);
  }

  /**
   * Runs a comparison of equivalent cost against a throwaway hash, so a login
   * for an unknown e-mail takes about as long as a wrong password (RN08).
   * Always resolves to false.
   */
  async verifyAgainstDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash(randomBytes(32).toString("hex"));
    await bcrypt.compare(prehash(password), await this.dummyHash);
    return false;
  }
}
