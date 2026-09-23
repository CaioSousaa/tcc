import { InMemoryUserRepository } from "./InMemoryUserRepository";
import { AuthService } from "../../services/AuthService";
import { PasswordService } from "../../services/PasswordService";
import { TokenService } from "../../services/TokenService";

export const TEST_SECRET = "test-secret-with-at-least-32-characters!!";
export const PERSISTENT_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SHORT_TTL_SECONDS = 8 * 60 * 60;

export function makeTokenService(secret: string = TEST_SECRET): TokenService {
  return new TokenService({
    secret,
    persistentTtlSeconds: PERSISTENT_TTL_SECONDS,
    shortTtlSeconds: SHORT_TTL_SECONDS,
  });
}

export function makeAuthContext() {
  const users = new InMemoryUserRepository();
  const passwords = new PasswordService();
  const tokens = makeTokenService();
  const authService = new AuthService(users, passwords, tokens);
  return { users, passwords, tokens, authService };
}

export const VALID_REGISTER = {
  name: "Ana Lima",
  email: "ana@empresa.com",
  password: "senha12345",
  confirmPassword: "senha12345",
};
