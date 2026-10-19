import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseEnv } from "../env";
import { ADMIN_ROLE, type Permission, PERMISSIONS } from "../lib/permissions";
import { SITE_TEXTS } from "../lib/site";
import * as schema from "./schema";

const { menus, rolePermissions, roles, texts } = schema;

const SYSTEM_ROLES: { key: string; name: string; permissions: readonly Permission[] }[] = [
  { key: ADMIN_ROLE, name: "Администратор", permissions: PERMISSIONS },
  {
    key: "editor",
    name: "Редактор",
    permissions: [
      "view_admin",
      "edit_pages",
      "edit_menus",
      "edit_texts",
      "edit_articles",
      "edit_media",
      "edit_from_front",
    ],
  },
];

const MENUS = [
  { key: "main", title: "Главное меню" },
  { key: "footer", title: "Меню в подвале" },
];

// Идемпотентен: запускается после миграций при каждом деплое.
// Права новой роли выставляются один раз, дальше ими управляют из админки.
// Исключение — admin: ему всегда выдаются все права, включая добавленные позже.
// Меню и тексты лейаута тоже создаются только если их ещё нет.
async function main() {
  const { DATABASE_URL } = parseEnv(process.env);
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema, casing: "snake_case" });

  try {
    await db.transaction(async (tx) => {
      for (const role of SYSTEM_ROLES) {
        const [created] = await tx
          .insert(roles)
          .values({ key: role.key, name: role.name, isSystem: true })
          .onConflictDoNothing({ target: roles.key })
          .returning({ id: roles.id });

        const roleId =
          created?.id ??
          (await tx.select({ id: roles.id }).from(roles).where(eq(roles.key, role.key)))[0].id;

        if (created || role.key === ADMIN_ROLE) {
          await tx
            .insert(rolePermissions)
            .values(role.permissions.map((permission) => ({ roleId, permission })))
            .onConflictDoNothing();
        }
      }

      await tx.insert(menus).values(MENUS).onConflictDoNothing({ target: menus.key });
      // Тексты лейаута создаются один раз, дальше их правят в админке.
      await tx
        .insert(texts)
        .values(SITE_TEXTS.map((text) => ({ ...text })))
        .onConflictDoNothing({ target: texts.key });
    });
    console.log("Сид применён");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
