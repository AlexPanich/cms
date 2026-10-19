import { boolean, integer, pgEnum, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { PERMISSIONS } from "../../lib/permissions";
import { id, timestamps } from "./columns";

// Поля совпадают со схемой пользователя Better Auth (этап 3), поэтому id текстовый.
export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  ...timestamps,
});

export const roles = pgTable("roles", {
  id: id(),
  key: text().notNull().unique(),
  name: text().notNull(),
  // Системные роли создаёт сид, их нельзя удалить из админки.
  isSystem: boolean().notNull().default(false),
  ...timestamps,
});

export const permissionEnum = pgEnum("permission", PERMISSIONS);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permission: permissionEnum().notNull(),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permission] })],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer()
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);
