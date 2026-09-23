import type { PublicUser } from "../services/AuthService";

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware; the only source of identity (RN13). */
      user?: PublicUser;
    }
  }
}

export {};
