import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

function createDb() {
  const client = postgres(env().DATABASE_URL, { max: 10 });
  return drizzle(client, { schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
// Сервисы принимают Executor, чтобы их можно было вызвать внутри чужой транзакции.
export type Executor = Db | Tx;

// В dev hot reload пересоздаёт модули — держим один пул соединений на процесс.
const globalForDb = globalThis as unknown as { db?: Db };

export function db(): Db {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

export async function closeDb(): Promise<void> {
  await globalForDb.db?.$client.end();
  globalForDb.db = undefined;
}
