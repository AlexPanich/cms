import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, type RichTextDoc, timestamps } from "./columns";

export const pages = pgTable(
  "pages",
  {
    id: id(),
    // ON DELETE NO ACTION: удалить страницу с дочерними нельзя, сначала нужно перенести
    // или удалить потомков. В отличие от RESTRICT, разрешает удалить ветку одним запросом.
    parentId: integer().references((): AnyPgColumn => pages.id),
    slug: text().notNull(),
    // Полный путь без ведущего слэша («about/team»). Вычисляется в src/server/pages/service.ts.
    path: text().notNull(),
    title: text().notNull(),
    menuTitle: text(),
    metaDescription: text(),
    content: jsonb().$type<RichTextDoc>(),
    // Ключ лейаута из реестра шаблонов в коде.
    template: text().notNull().default("default"),
    published: boolean().notNull().default(false),
    isHome: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pages_path_unique").on(t.path),
    uniqueIndex("pages_single_home")
      .on(t.isHome)
      .where(sql`${t.isHome}`),
    index("pages_parent_sort_idx").on(t.parentId, t.sort),
    check("pages_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    check("pages_not_own_parent", sql`${t.parentId} <> ${t.id}`),
  ],
);
