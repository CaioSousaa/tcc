process.env.NODE_ENV = "test";
process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "test";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "test";
process.env.POSTGRES_DB = process.env.POSTGRES_DB ?? "test";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "test-access-secret";
process.env.JWT_ACCESS_EXPIRES_IN_SECONDS = process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? "900";
process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS =
  process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS ?? String(60 * 60 * 24 * 30);
