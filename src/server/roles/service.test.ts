import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { roles } from "@/db/schema";
import { ADMIN_ROLE, PERMISSIONS } from "@/lib/permissions";
import { withRollback } from "@/test/db";
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  RoleError,
  type RoleErrorCode,
  updateRole,
} from "./service";

async function expectRoleError(promise: Promise<unknown>, code: RoleErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof RoleError && error.code === code,
  );
}

async function roleId(tx: Tx, key: string) {
  const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.key, key));
  return role.id;
}

describe("roles service", () => {
  it("создаёт роль без дублей прав и показывает их в порядке PERMISSIONS", () =>
    withRollback(async (tx) => {
      const { id } = await createRole(tx, {
        key: "writer",
        name: "Автор",
        permissions: ["edit_texts", "view_admin", "edit_texts"],
      });
      expect(await getRole(tx, id)).toMatchObject({
        key: "writer",
        isSystem: false,
        permissions: ["view_admin", "edit_texts"],
        userCount: 0,
      });
    }));

  it("не создаёт роль с занятым ключом", () =>
    withRollback(async (tx) => {
      await expectRoleError(createRole(tx, { key: ADMIN_ROLE, name: "Ещё админ" }), "key_taken");
    }));

  it("заменяет права и название", () =>
    withRollback(async (tx) => {
      const { id } = await createRole(tx, {
        key: "writer",
        name: "Автор",
        permissions: ["edit_texts"],
      });
      await updateRole(tx, id, {
        key: "author",
        name: "Автор статей",
        permissions: ["edit_articles"],
      });
      expect(await getRole(tx, id)).toMatchObject({
        key: "author",
        name: "Автор статей",
        permissions: ["edit_articles"],
      });
    }));

  it("защищает системные роли", () =>
    withRollback(async (tx) => {
      const adminId = await roleId(tx, ADMIN_ROLE);
      const editorId = await roleId(tx, "editor");

      await expectRoleError(
        updateRole(tx, editorId, { key: "redactor", name: "Редактор" }),
        "system_role",
      );
      await expectRoleError(
        updateRole(tx, adminId, { key: ADMIN_ROLE, name: "Админ", permissions: ["view_admin"] }),
        "system_role",
      );
      await expectRoleError(deleteRole(tx, editorId), "system_role");

      await updateRole(tx, adminId, {
        key: ADMIN_ROLE,
        name: "Главный",
        permissions: [...PERMISSIONS],
      });
      expect((await getRole(tx, adminId))?.name).toBe("Главный");
    }));

  it("удаляет обычную роль", () =>
    withRollback(async (tx) => {
      const { id } = await createRole(tx, { key: "temp", name: "Временная" });
      await deleteRole(tx, id);
      expect((await listRoles(tx)).some((role) => role.id === id)).toBe(false);
      await expectRoleError(deleteRole(tx, id), "role_not_found");
    }));
});
