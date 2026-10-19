import "server-only";
import { eq } from "drizzle-orm";
import type { Executor } from "@/db";
import { rolePermissions, userRoles } from "@/db/schema";
import type { Permission } from "@/lib/permissions";

// Права пользователя — объединение прав всех его ролей.
export async function getUserPermissions(
  executor: Executor,
  userId: string,
): Promise<Set<Permission>> {
  const rows = await executor
    .selectDistinct({ permission: rolePermissions.permission })
    .from(userRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
  return new Set(rows.map((r) => r.permission));
}
