import type { PgTable } from "drizzle-orm/pg-core";
import { afterAll } from "vitest";
import { closeDb, db, type Tx } from "@/db";

class Rollback extends Error {}

// Выполняет тест в транзакции и откатывает её, чтобы тесты не оставляли данных в БД.
// clear — таблицы, которые нужно очистить в начале теста, чтобы он не зависел от данных
// dev-базы. Очистка тоже откатывается.
export async function withRollback(
  fn: (tx: Tx) => Promise<void>,
  { clear = [] }: { clear?: PgTable[] } = {},
): Promise<void> {
  try {
    await db().transaction(async (tx) => {
      for (const table of clear) await tx.delete(table);
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
}

afterAll(closeDb);
