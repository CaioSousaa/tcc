import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: optionalNumber("PORT", 3333),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  postgres: {
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: optionalNumber("POSTGRES_PORT", 5432),
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    database: required("POSTGRES_DB"),
  },
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  jwtAccessExpiresInSeconds: optionalNumber("JWT_ACCESS_EXPIRES_IN_SECONDS", 900),
  refreshTokenExpiresInSeconds: optionalNumber(
    "REFRESH_TOKEN_EXPIRES_IN_SECONDS",
    60 * 60 * 24 * 30,
  ),
};
