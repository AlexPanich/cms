import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Применяет миграции из drizzle/. Вызывается из pnpm db:migrate и перед тестами.
export async function migrateDatabase(databaseUrl: string): Promise<void> {
  // Notice «already exists, skipping» от служебных CREATE … IF NOT EXISTS — не ошибки.
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  } finally {
    await client.end();
  }
}
