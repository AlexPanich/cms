import "server-only";
import { asc, count, eq } from "drizzle-orm";
import type { Executor } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { rolePermissions, roles, userRoles } from "@/db/schema";
import { ADMIN_ROLE, type Permission, PERMISSIONS } from "@/lib/permissions";
import { DomainError } from "@/server/errors";
import { type RoleInput, roleInputSchema } from "./schema";

export type RoleErrorCode = "role_not_found" | "key_taken" | "system_role";

export class RoleError extends DomainError<RoleErrorCode> {}

export type RoleSummary = {
  id: number;
  key: string;
  name: string;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
};

const notFound = () => new RoleError("role_not_found", "Роль не найдена");

// Права в порядке PERMISSIONS, чтобы списки в интерфейсе не прыгали.
const sortPermissions = (list: Permission[]) =>
  PERMISSIONS.filter((permission) => list.includes(permission));

export async function listRoles(executor: Executor): Promise<RoleSummary[]> {
  const [roleRows, permissionRows, countRows] = await Promise.all([
    executor.select().from(roles).orderBy(asc(roles.id)),
    executor.select().from(rolePermissions),
    executor
      .select({ roleId: userRoles.roleId, value: count() })
      .from(userRoles)
      .groupBy(userRoles.roleId),
  ]);

  return roleRows.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    isSystem: role.isSystem,
    permissions: sortPermissions(
      permissionRows.filter((row) => row.roleId === role.id).map((row) => row.permission),
    ),
    userCount: countRows.find((row) => row.roleId === role.id)?.value ?? 0,
  }));
}

export async function getRole(executor: Executor, id: number): Promise<RoleSummary | null> {
  return (await listRoles(executor)).find((role) => role.id === id) ?? null;
}

function toRoleError(error: unknown): unknown {
  return isUniqueViolation(error, "roles_key_unique")
    ? new RoleError("key_taken", "Роль с таким ключом уже существует", "key")
    : error;
}

export async function createRole(executor: Executor, input: RoleInput): Promise<{ id: number }> {
  const data = roleInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    try {
      const [role] = await tx
        .insert(roles)
        .values({ key: data.key, name: data.name })
        .returning({ id: roles.id });
      if (data.permissions.length > 0) {
        await tx
          .insert(rolePermissions)
          .values(data.permissions.map((permission) => ({ roleId: role.id, permission })));
      }
      return role;
    } catch (error) {
      throw toRoleError(error);
    }
  });
}

export async function updateRole(executor: Executor, id: number, input: RoleInput): Promise<void> {
  const data = roleInputSchema.parse(input);
  await executor.transaction(async (tx) => {
    const [role] = await tx.select().from(roles).where(eq(roles.id, id)).for("update");
    if (!role) throw notFound();

    if (role.isSystem && data.key !== role.key) {
      throw new RoleError("system_role", "Ключ системной роли изменить нельзя", "key");
    }
    if (role.key === ADMIN_ROLE && data.permissions.length !== PERMISSIONS.length) {
      throw new RoleError("system_role", "У администратора всегда все права", "permissions");
    }

    try {
      await tx.update(roles).set({ key: data.key, name: data.name }).where(eq(roles.id, id));
    } catch (error) {
      throw toRoleError(error);
    }

    await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    if (data.permissions.length > 0) {
      await tx
        .insert(rolePermissions)
        .values(data.permissions.map((permission) => ({ roleId: id, permission })));
    }
  });
}

export async function deleteRole(executor: Executor, id: number): Promise<void> {
  await executor.transaction(async (tx) => {
    const [role] = await tx.select().from(roles).where(eq(roles.id, id)).for("update");
    if (!role) throw notFound();
    if (role.isSystem) throw new RoleError("system_role", "Системную роль удалить нельзя");
    // Связи с пользователями и правами удаляются каскадом.
    await tx.delete(roles).where(eq(roles.id, id));
  });
}
