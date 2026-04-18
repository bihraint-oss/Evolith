import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_FILE: z.string().min(1).default("packages/server/dev.db"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(1)
    .default("replace-with-a-long-random-access-secret"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1)
    .default("replace-with-a-long-random-refresh-secret"),
  JWT_ACCESS_TTL: z.string().min(1).default("15m"),
  JWT_REFRESH_TTL: z.string().min(1).default("7d"),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(
  input: Record<string, string | undefined> = Bun.env,
): Env {
  const parsed = envSchema.safeParse(input);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsed.data;
}
