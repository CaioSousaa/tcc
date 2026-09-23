import jwt from "jsonwebtoken";

export type SessionKind = "persistent" | "short";

export type TokenVerification =
  | { status: "valid"; userId: string }
  | { status: "expired" }
  | { status: "invalid" };

export type TokenServiceOptions = {
  secret: string;
  persistentTtlSeconds: number;
  shortTtlSeconds: number;
};

const ALGORITHM = "HS256";
export const MIN_SECRET_LENGTH = 32;

export class TokenService {
  private readonly options: TokenServiceOptions;

  constructor(options: TokenServiceOptions) {
    if (options.secret.length < MIN_SECRET_LENGTH) {
      throw new Error(`JWT secret must have at least ${MIN_SECRET_LENGTH} characters`);
    }
    this.options = options;
  }

  ttlSeconds(kind: SessionKind): number {
    return kind === "persistent" ? this.options.persistentTtlSeconds : this.options.shortTtlSeconds;
  }

  /** The token carries only the subject and timestamps (A13, A14). */
  sign(userId: string, kind: SessionKind): string {
    return jwt.sign({}, this.options.secret, {
      algorithm: ALGORITHM,
      subject: userId,
      expiresIn: this.ttlSeconds(kind),
    });
  }

  verify(token: string): TokenVerification {
    try {
      // Algorithm is pinned; the algorithm announced by the token is never trusted (A15).
      const payload = jwt.verify(token, this.options.secret, { algorithms: [ALGORITHM] });
      if (typeof payload === "string" || typeof payload.sub !== "string" || payload.sub === "") {
        return { status: "invalid" };
      }
      return { status: "valid", userId: payload.sub };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) return { status: "expired" };
      return { status: "invalid" };
    }
  }
}
