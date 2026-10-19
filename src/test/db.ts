import { afterAll } from "vitest";
import { closeDb, db, type Tx } from "@/db";

class Rollback extends Error {}

// Выполняет тест в транзакции и откатывает её, чтобы тесты не оставляли данных в БД.
export async function withRollback(fn: (tx: Tx) => Promise<void>): Promise<void> {
  try {
    await db().transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    });
  } catch (error) {
    if (!(error instanceof Rollback)) throw error;
  }
}

afterAll(closeDb);
