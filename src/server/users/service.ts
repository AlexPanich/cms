import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, asc, count, eq, ilike, inArray, ne, or } from "drizzle-orm";
import type { Executor, Tx } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { accounts, roles, sessions, userRoles, users } from "@/db/schema";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { ADMIN_ROLE } from "@/lib/permissions";
import { DomainError } from "@/server/errors";
import {
  type NewUserInput,
  newUserSchema,
  type PasswordInput,
  passwordSchema,
  type UserInput,
  userInputSchema,
} from "./schema";

export type UserErrorCode =
  "user_not_found" | "email_taken" | "role_not_found" | "last_admin" | "self_delete";

export class UserError extends DomainError<UserErrorCode> {}

const notFound = () => new UserError("user_not_found", "Пользователь не найден");

function toUserError(error: unknown): unknown {
  return isUniqueViolation(error, "users_email_unique")
    ? new UserError("email_taken", "Пользователь с таким email уже существует", "email")
    : error;
}

async function resolveRoles(tx: Tx, keys: string[]) {
  if (keys.length === 0) return [];
  const found = await tx
    .select({ id: roles.id, key: roles.key })
    .from(roles)
    .where(inArray(roles.key, keys));
  const missing = keys.filter((key) => !found.some((role) => role.key === key));
  if (missing.length > 0) {
    throw new UserError("role_not_found", `Роль не найдена: ${missing.join(", ")}`, "roleKeys");
  }
  return found;
}

async function lockUser(tx: Tx, id: string) {
  const [user] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .for("update");
  if (!user) throw notFound();
}

// Вызывается перед тем, как пользователь потеряет роль admin (снятие роли или удаление).
// Блокировка строки роли сериализует параллельные изменения администраторов.
async function assertAdminRemains(tx: Tx, userId: string) {
  const [admin] = await tx
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, ADMIN_ROLE))
    .for("update");
  if (!admin) return;

  const [membership] = await tx
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .where(and(eq(userRoles.roleId, admin.id), eq(userRoles.userId, userId)));
  if (!membership) return;

  const [{ others }] = await tx
    .select({ others: count() })
    .from(userRoles)
    .where(and(eq(userRoles.roleId, admin.id), ne(userRoles.userId, userId)));
  if (others === 0) {
    throw new UserError("last_admin", "Нельзя оставить систему без администратора", "roleKeys");
  }
}

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  roles: { key: string; name: string }[];
};

export async function listUsers(
  executor: Executor,
  { page, search }: { page: number; search: string },
): Promise<{ items: UserListItem[]; total: number }> {
  const where = search
    ? or(ilike(users.name, likePattern(search)), ilike(users.email, likePattern(search)))
    : undefined;

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(where)
      .orderBy(asc(users.name), asc(users.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(users).where(where),
  ]);

  const roleRows =
    rows.length === 0
      ? []
      : await executor
          .select({ userId: userRoles.userId, key: roles.key, name: roles.name })
          .from(userRoles)
          .innerJoin(roles, eq(roles.id, userRoles.roleId))
          .where(
            inArray(
              userRoles.userId,
              rows.map((row) => row.id),
            ),
          )
          .orderBy(asc(roles.id));

  return {
    total,
    items: rows.map((row) => ({
      ...row,
      roles: roleRows
        .filter((role) => role.userId === row.id)
        .map(({ key, name }) => ({ key, name })),
    })),
  };
}

export async function getUser(executor: Executor, id: string) {
  const [user] = await executor
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, id));
  if (!user) return null;

  const roleRows = await executor
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, id));
  return { ...user, roleKeys: roleRows.map((row) => row.key) };
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
    const foundRoles = await resolveRoles(tx, data.roleKeys);

    const id = randomUUID();
    try {
      await tx
        .insert(users)
        .values({ id, name: data.name, email: data.email, emailVerified: true });
    } catch (error) {
      throw toUserError(error);
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

export async function updateUser(executor: Executor, id: string, input: UserInput): Promise<void> {
  const data = userInputSchema.parse(input);
  await executor.transaction(async (tx) => {
    await lockUser(tx, id);
    const foundRoles = await resolveRoles(tx, data.roleKeys);
    if (!data.roleKeys.includes(ADMIN_ROLE)) {
      await assertAdminRemains(tx, id);
    }

    try {
      await tx.update(users).set({ name: data.name, email: data.email }).where(eq(users.id, id));
    } catch (error) {
      throw toUserError(error);
    }

    await tx.delete(userRoles).where(eq(userRoles.userId, id));
    if (foundRoles.length > 0) {
      await tx
        .insert(userRoles)
        .values(foundRoles.map((role) => ({ userId: id, roleId: role.id })));
    }
  });
}

// Меняет пароль и завершает сессии пользователя на других устройствах.
// keepSessionId — текущая сессия, если пароль меняют самому себе.
export async function setUserPassword(
  executor: Executor,
  id: string,
  input: PasswordInput,
  { keepSessionId }: { keepSessionId?: string } = {},
): Promise<void> {
  const { password } = passwordSchema.parse(input);
  const passwordHash = await hashPassword(password);

  await executor.transaction(async (tx) => {
    await lockUser(tx, id);

    const updated = await tx
      .update(accounts)
      .set({ password: passwordHash })
      .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")))
      .returning({ id: accounts.id });
    if (updated.length === 0) {
      await tx.insert(accounts).values({
        id: randomUUID(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password: passwordHash,
      });
    }

    await tx
      .delete(sessions)
      .where(
        keepSessionId
          ? and(eq(sessions.userId, id), ne(sessions.id, keepSessionId))
          : eq(sessions.userId, id),
      );
  });
}

export async function deleteUser(executor: Executor, id: string, actorId: string): Promise<void> {
  if (id === actorId) {
    throw new UserError("self_delete", "Нельзя удалить собственную учётную запись");
  }
  await executor.transaction(async (tx) => {
    await lockUser(tx, id);
    await assertAdminRemains(tx, id);
    // Сессии, аккаунты и роли удаляются каскадом.
    await tx.delete(users).where(eq(users.id, id));
  });
}
