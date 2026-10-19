import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";

function createAuth() {
  return betterAuth({
    appName: "CMS",
    secret: env().BETTER_AUTH_SECRET,
    baseURL: env().BETTER_AUTH_URL,
    database: drizzleAdapter(db(), { provider: "pg", schema, usePlural: true }),
    // Регистрации нет: пользователей создаёт администратор (src/server/users/service.ts).
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    telemetry: { enabled: false },
    // nextCookies должен быть последним: ставит cookie сессии из server actions.
    plugins: [nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

// Создаём лениво, чтобы `next build` не требовал переменных окружения.
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
