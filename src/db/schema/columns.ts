import { integer, timestamp } from "drizzle-orm/pg-core";

// Документ TipTap (ProseMirror JSON). Точный тип появится вместе с редактором на этапе 4.
export type RichTextDoc = { type: "doc"; content?: unknown[] };

export const id = () => integer().primaryKey().generatedAlwaysAsIdentity();

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
