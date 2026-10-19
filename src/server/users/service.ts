import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { inArray } from "drizzle-orm";
import type { Executor } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { accounts, roles, userRoles, users } from "@/db/schema";
import { type NewUserInput, newUserSchema } from "./schema";

export type UserErrorCode = "email_taken" | "role_not_found";

export class UserError extends Error {
  constructor(
    readonly code: UserErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UserError";
  }
}

// Создаёт пользователя с паролем так же, как это сделал бы Better Auth (аккаунт "credential"
// с хешем из better-auth/crypto), но одной транзакцией вместе с ролями.
export async function createUserWithPassword(
  executor: Executor,
  input: NewUserInput,
): Promise<{ id: string }> {
  const data = newUserSchema.parse(input);
  const passwordHash = await hashPassword(data.password);

  return executor.transaction(async (tx) => {
    const foundRoles =
      data.roleKeys.length === 0
        ? []
        : await tx
            .select({ id: roles.id, key: roles.key })
            .from(roles)
            .where(inArray(roles.key, data.roleKeys));
    const missing = data.roleKeys.filter((key) => !foundRoles.some((role) => role.key === key));
    if (missing.length > 0) {
      throw new UserError("role_not_found", `Роль не найдена: ${missing.join(", ")}`);
    }

    const id = randomUUID();
    try {
      await tx
        .insert(users)
        .values({ id, name: data.name, email: data.email, emailVerified: true });
    } catch (error) {
      if (isUniqueViolation(error, "users_email_unique")) {
        throw new UserError("email_taken", "Пользователь с таким email уже существует");
      }
      throw error;
    }

    await tx.insert(accounts).values({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: "credential",
      password: passwordHash,
    });

    if (foundRoles.length > 0) {
      await tx
        .insert(userRoles)
        .values(foundRoles.map((role) => ({ userId: id, roleId: role.id })));
    }
    return { id };
  });
}
