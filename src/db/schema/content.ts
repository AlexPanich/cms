import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { RichTextDoc } from "../../lib/rich-text";
import { id, timestamps } from "./columns";
import { media } from "./media";

// Именованные текстовые блоки, которые шаблоны вставляют по ключу.
export const texts = pgTable("texts", {
  id: id(),
  key: text().notNull().unique(),
  title: text().notNull(),
  body: text().notNull().default(""),
  published: boolean().notNull().default(true),
  ...timestamps,
});

export const articles = pgTable(
  "articles",
  {
    id: id(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    excerpt: text(),
    content: jsonb().$type<RichTextDoc>(),
    previewId: integer().references(() => media.id, { onDelete: "set null" }),
    published: boolean().notNull().default(false),
    publishedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("articles_published_idx").on(t.published, t.publishedAt),
    check("articles_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);
