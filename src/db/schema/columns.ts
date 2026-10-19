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
// записи (generated column). Из документа TipTap берутся только значения полей «text» —
// то есть текст, без адресов ссылок и типов узлов. Веса: A — заголовок, B — описание, C — текст.
export const searchVectorSql = (
  title: AnyPgColumn,
  description: AnyPgColumn,
  content: AnyPgColumn,
): SQL =>
  sql`setweight(to_tsvector('russian', ${title}), 'A')
    || setweight(to_tsvector('russian', coalesce(${description}, '')), 'B')
    || setweight(to_tsvector('russian', coalesce(jsonb_path_query_array(${content}, 'strict $.**.text'), '[]'::jsonb)), 'C')`;
