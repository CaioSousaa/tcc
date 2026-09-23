import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: optional("NODE_ENV", "development") === "production",
  port: Number(optional("PORT", "3333")),
  database: {
    host: optional("DB_HOST", "localhost"),
    port: Number(optional("DB_PORT", "5432")),
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    name: required("POSTGRES_DB"),
  },
  auth: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    accessTokenTtl: optional("ACCESS_TOKEN_TTL", "15m"),
    refreshTokenTtlDays: Number(optional("REFRESH_TOKEN_TTL_DAYS", "30")),
    cookieDomain: optional("COOKIE_DOMAIN", "localhost"),
  },
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:3000"),
};
