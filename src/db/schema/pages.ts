import { type SQL, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { id, searchVectorSql, timestamps, tsvector } from "./columns";
import { media } from "./media";

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
    // Блоки страницы: [{ id, type, variant, data }], data проверяется схемой типа блока
    // (src/lib/blocks/registry.ts). Читаются через parseStoredBlocks: в БД может лежать
    // блок, который больше не проходит схему или чей тип убрали из реестра.
    blocks: jsonb().$type<unknown[]>().notNull().default([]),
    // Текст блоков для поиска. Его пишет сервис при сохранении (blocksSearchText): из JSON
    // блоков Postgres не знает, какие поля — текст.
    searchText: text().notNull().default(""),
    // Ключ лейаута из реестра шаблонов в коде.
    template: text().notNull().default("default"),
    published: boolean().notNull().default(false),
    isHome: boolean().notNull().default(false),
    sort: integer().notNull().default(0),
    searchVector: tsvector().generatedAlwaysAs((): SQL =>
      searchVectorSql(pages.title, pages.metaDescription, sql`${pages.searchText}`),
    ),
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
    index("pages_search_idx").using("gin", t.searchVector),
  ],
);

// Картинки из блоков страницы — для подсчёта использования media. Пишется сервисом
// при сохранении блоков вместе с ними.
export const pageMedia = pgTable(
  "page_media",
  {
    pageId: integer()
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    mediaId: integer()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.mediaId] }),
    index("page_media_media_idx").on(t.mediaId),
  ],
);
