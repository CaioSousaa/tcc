import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
  POSTGRES_HOST: z.string().min(1).default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must have at least 32 characters"),
  SESSION_PERSISTENT_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_SHORT_TTL_HOURS: z.coerce.number().int().positive().default(8),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .refine((value) => value !== "*", "CORS_ORIGIN must be an explicit origin, not *"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates the environment. Throws on any invalid or missing value so the
 * process never starts with an insecure or incomplete configuration.
 */
export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}
