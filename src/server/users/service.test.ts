import { verifyPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { accounts, rolePermissions, roles, users } from "@/db/schema";
import { getUserPermissions } from "@/server/auth/permissions";
import { withRollback } from "@/test/db";
import { createUserWithPassword, UserError, type UserErrorCode } from "./service";

const PASSWORD = "correct horse battery";

async function expectUserError(promise: Promise<unknown>, code: UserErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof UserError && error.code === code,
  );
}

describe("createUserWithPassword", () => {
  it("создаёт пользователя с аккаунтом credential, хешем Better Auth и ролями", () =>
    withRollback(async (tx) => {
      const { id } = await createUserWithPassword(tx, {
        name: "Анна",
        email: "  Anna@Example.COM ",
        password: PASSWORD,
        roleKeys: ["editor"],
      });

      const [user] = await tx.select().from(users).where(eq(users.id, id));
      expect(user).toMatchObject({ email: "anna@example.com", emailVerified: true });

      const [account] = await tx.select().from(accounts).where(eq(accounts.userId, id));
      expect(account).toMatchObject({ providerId: "credential", accountId: id });
      expect(account.password).not.toBe(PASSWORD);
      expect(await verifyPassword({ hash: account.password!, password: PASSWORD })).toBe(true);
      expect(await verifyPassword({ hash: account.password!, password: "wrong" })).toBe(false);

      const permissions = await getUserPermissions(tx, id);
      expect(permissions.has("edit_pages")).toBe(true);
      expect(permissions.has("edit_users")).toBe(false);
    }));

  it("не создаёт второго пользователя с тем же email без учёта регистра", () =>
    withRollback(async (tx) => {
      await createUserWithPassword(tx, { name: "A", email: "dup@example.com", password: PASSWORD });
      await expectUserError(
        createUserWithPassword(tx, { name: "B", email: "DUP@example.com", password: PASSWORD }),
        "email_taken",
      );
    }));

  it("ничего не создаёт, если роли нет", () =>
    withRollback(async (tx) => {
      await expectUserError(
        createUserWithPassword(tx, {
          name: "A",
          email: "norole@example.com",
          password: PASSWORD,
          roleKeys: ["editor", "ghost"],
        }),
        "role_not_found",
      );
      const found = await tx.select().from(users).where(eq(users.email, "norole@example.com"));
      expect(found).toEqual([]);
    }));

  it("отклоняет короткий пароль", () =>
    withRollback(async (tx) => {
      await expect(
        createUserWithPassword(tx, { name: "A", email: "short@example.com", password: "123456" }),
      ).rejects.toThrow(/Пароль не короче/);
    }));
});

describe("getUserPermissions", () => {
  it("объединяет права всех ролей пользователя", () =>
    withRollback(async (tx) => {
      const [writer, moderator] = await tx
        .insert(roles)
        .values([
          { key: "test-writer", name: "Автор" },
          { key: "test-moderator", name: "Модератор" },
        ])
        .returning({ id: roles.id });
      await tx.insert(rolePermissions).values([
        { roleId: writer.id, permission: "view_admin" },
        { roleId: writer.id, permission: "edit_texts" },
        { roleId: moderator.id, permission: "view_admin" },
        { roleId: moderator.id, permission: "edit_menus" },
      ]);

      const { id } = await createUserWithPassword(tx, {
        name: "A",
        email: "multi@example.com",
        password: PASSWORD,
        roleKeys: ["test-writer", "test-moderator"],
      });

      expect([...(await getUserPermissions(tx, id))].sort()).toEqual([
        "edit_menus",
        "edit_texts",
        "view_admin",
      ]);
    }));

  it("у пользователя без ролей прав нет", () =>
    withRollback(async (tx) => {
      const { id } = await createUserWithPassword(tx, {
        name: "A",
        email: "none@example.com",
        password: PASSWORD,
      });
      expect((await getUserPermissions(tx, id)).size).toBe(0);
    }));
});
