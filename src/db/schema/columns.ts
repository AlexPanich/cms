import { type SQL, sql } from "drizzle-orm";
import { type AnyPgColumn, customType, integer, timestamp } from "drizzle-orm/pg-core";

export const id = () => integer().primaryKey().generatedAlwaysAsIdentity();

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

// Выражение для вектора полнотекстового поиска: Postgres пересчитывает его сам при каждой
// записи (generated column). Веса: A — заголовок, B — описание, C — текст.
export const searchVectorSql = (title: AnyPgColumn, description: AnyPgColumn, text: SQL): SQL =>
  sql`setweight(to_tsvector('russian', ${title}), 'A')
    || setweight(to_tsvector('russian', coalesce(${description}, '')), 'B')
    || setweight(to_tsvector('russian', ${text}), 'C')`;

// Текст документа TipTap для поиска: только значения полей «text» — без адресов ссылок
// и типов узлов.
export const richTextSearchSql = (content: AnyPgColumn): SQL =>
  sql`coalesce(jsonb_path_query_array(${content}, 'strict $.**.text'), '[]'::jsonb)`;
