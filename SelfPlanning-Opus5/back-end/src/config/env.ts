import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];

  return value && value.length > 0 ? value : fallback;
}

export const env = {
  port: Number(optional("PORT", "3333")),
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:3000"),
  database: {
    host: optional("DB_HOST", "localhost"),
    port: Number(optional("DB_PORT", "5432")),
    user: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    name: required("POSTGRES_DB"),
  },
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
    refreshExpiresInDays: Number(optional("REFRESH_TOKEN_EXPIRES_IN_DAYS", "30")),
  },
};
