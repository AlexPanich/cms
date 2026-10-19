import { z } from "./lib/zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  STORAGE_DIR: z.string().min(1).default("./storage"),
  // Подписывает cookie сессий. Сгенерировать: openssl rand -base64 32
  BETTER_AUTH_SECRET: z.string().min(32, "Минимум 32 символа"),
  // Публичный адрес приложения, с которого браузер ходит в /api/auth.
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Некорректные переменные окружения:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

let cached: Env | undefined;

// Читаем лениво: во время `next build` переменных окружения может не быть.
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
