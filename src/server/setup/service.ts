import "server-only";
import { sql } from "drizzle-orm";
import type { Executor } from "@/db";
import { users } from "@/db/schema";
import { ADMIN_ROLE } from "@/lib/permissions";
import { DomainError } from "@/server/errors";
import { createUserWithPassword } from "@/server/users/service";
import { type SetupInput, setupInputSchema } from "./schema";

export class SetupError extends DomainError<"already_done"> {}

export async function hasUsers(executor: Executor): Promise<boolean> {
  const [user] = await executor.select({ id: users.id }).from(users).limit(1);
  return Boolean(user);
}

// Первого администратора создаёт тот, кто первым откроет /setup, — пока в базе нет ни одного
// пользователя. Advisory lock сериализует одновременные попытки: вторая увидит пользователя,
// созданного первой, и получит ошибку.
export async function createFirstAdmin(
  executor: Executor,
  input: SetupInput,
): Promise<{ id: string }> {
  const data = setupInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"cms:first-admin"}))`);
    if (await hasUsers(tx)) {
      throw new SetupError("already_done", "Администратор уже создан. Войдите в систему");
    }
    return createUserWithPassword(tx, { ...data, roleKeys: [ADMIN_ROLE] });
  });
}
