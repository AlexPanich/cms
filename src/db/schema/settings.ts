import { sql } from "drizzle-orm";
import { check, integer, jsonb, pgTable } from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { media } from "./media";

// Настройки сайта — одна запись (id = 1). data проверяется схемой настроек
// (src/lib/site-settings.ts) и читается через readSiteSettings: в БД может лежать
// значение, которое больше не проходит схему.
export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer().primaryKey().default(1),
    data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (t) => [check("site_settings_single_row", sql`${t.id} = 1`)],
);

// Картинки из настроек (логотип) — для подсчёта использования media. Пишется сервисом
// настроек вместе с ними.
export const settingsMedia = pgTable("settings_media", {
  mediaId: integer()
    .primaryKey()
    .references(() => media.id, { onDelete: "cascade" }),
});
