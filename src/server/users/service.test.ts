import { verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { accounts, rolePermissions, roles, sessions, users } from "@/db/schema";
import { ADMIN_ROLE } from "@/lib/permissions";
import { getUserPermissions } from "@/server/auth/permissions";
import { withRollback } from "@/test/db";
import {
  createUserWithPassword,
  deleteUser,
  getUser,
  listUsers,
  setUserPassword,
  updateUser,
  UserError,
  type UserErrorCode,
} from "./service";

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

// Тесты ниже считают администраторов и пользователей, поэтому начинают с пустой таблицы users.
const withUsers = (fn: (tx: Tx) => Promise<void>) => withRollback(fn, { clear: [users] });

const create = (tx: Tx, email: string, roleKeys: string[] = []) =>
  createUserWithPassword(tx, { name: email.split("@")[0], email, password: PASSWORD, roleKeys });

describe("listUsers", () => {
  it("ищет по имени и email, экранируя спецсимволы, и подтягивает роли", () =>
    withUsers(async (tx) => {
      await create(tx, "anna@example.com", ["editor"]);
      await create(tx, "boris@example.com");
      await createUserWithPassword(tx, {
        name: "Скидка 100%_",
        email: "sale@example.com",
        password: PASSWORD,
      });

      const byEmail = await listUsers(tx, { page: 1, search: "ANNA" });
      expect(byEmail.total).toBe(1);
      expect(byEmail.items[0].roles).toEqual([{ key: "editor", name: "Редактор" }]);

      const special = await listUsers(tx, { page: 1, search: "%_" });
      expect(special.items.map((u) => u.email)).toEqual(["sale@example.com"]);

      const all = await listUsers(tx, { page: 1, search: "" });
      expect(all.total).toBe(3);
    }));

  it("разбивает на страницы", () =>
    withUsers(async (tx) => {
      for (let i = 0; i < 21; i++) {
        await create(tx, `user${String(i).padStart(2, "0")}@example.com`);
      }
      const second = await listUsers(tx, { page: 2, search: "" });
      expect(second.total).toBe(21);
      expect(second.items).toHaveLength(1);
    }));
});

describe("updateUser", () => {
  it("меняет данные и заменяет роли", () =>
    withUsers(async (tx) => {
      await create(tx, "root@example.com", [ADMIN_ROLE]);
      const { id } = await create(tx, "anna@example.com", ["editor"]);

      await updateUser(tx, id, {
        name: "Анна",
        email: "Anna.New@example.com",
        roleKeys: [ADMIN_ROLE],
      });
      expect(await getUser(tx, id)).toMatchObject({
        name: "Анна",
        email: "anna.new@example.com",
        roleKeys: [ADMIN_ROLE],
      });
    }));

  it("не даёт занять чужой email", () =>
    withUsers(async (tx) => {
      await create(tx, "taken@example.com");
      const { id } = await create(tx, "anna@example.com");
      await expectUserError(
        updateUser(tx, id, { name: "A", email: "taken@example.com" }),
        "email_taken",
      );
    }));

  it("не снимает роль с последнего администратора, но снимает, если есть другой", () =>
    withUsers(async (tx) => {
      const { id: first } = await create(tx, "first@example.com", [ADMIN_ROLE]);
      await expectUserError(
        updateUser(tx, first, { name: "first", email: "first@example.com", roleKeys: ["editor"] }),
        "last_admin",
      );

      await create(tx, "second@example.com", [ADMIN_ROLE]);
      await updateUser(tx, first, {
        name: "first",
        email: "first@example.com",
        roleKeys: ["editor"],
      });
      expect((await getUser(tx, first))?.roleKeys).toEqual(["editor"]);
    }));
});

describe("setUserPassword", () => {
  it("меняет хеш и завершает сессии, кроме текущей", () =>
    withUsers(async (tx) => {
      const { id } = await create(tx, "anna@example.com");
      const expiresAt = new Date(Date.now() + 60_000);
      await tx.insert(sessions).values([
        { id: "current", token: "t1", userId: id, expiresAt },
        { id: "other", token: "t2", userId: id, expiresAt },
      ]);

      await setUserPassword(tx, id, { password: "new password 123" }, { keepSessionId: "current" });

      const [account] = await tx
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")));
      expect(await verifyPassword({ hash: account.password!, password: "new password 123" })).toBe(
        true,
      );
      expect(await verifyPassword({ hash: account.password!, password: PASSWORD })).toBe(false);

      const left = await tx
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.userId, id));
      expect(left).toEqual([{ id: "current" }]);
    }));
});

describe("deleteUser", () => {
  it("не даёт удалить себя и последнего администратора", () =>
    withUsers(async (tx) => {
      const { id: admin } = await create(tx, "admin@example.com", [ADMIN_ROLE]);
      const { id: editor } = await create(tx, "editor@example.com", ["editor"]);

      await expectUserError(deleteUser(tx, admin, admin), "self_delete");
      await expectUserError(deleteUser(tx, admin, editor), "last_admin");

      await deleteUser(tx, editor, admin);
      expect(await getUser(tx, editor)).toBeNull();
      await expectUserError(deleteUser(tx, editor, admin), "user_not_found");
    }));
});
