import { index, integer, pgEnum, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "./columns";
import { users } from "./users";

export const mediaKindEnum = pgEnum("media_kind", ["image", "document"]);

export const media = pgTable(
  "media",
  {
    id: id(),
    kind: mediaKindEnum().notNull(),
    // Путь файла внутри STORAGE_DIR. Имя генерируется сервером, а не берётся от пользователя.
    storageKey: text().notNull().unique("media_storage_key_unique"),
    originalName: text().notNull(),
    mimeType: text().notNull(),
    size: integer().notNull(),
    width: integer(),
    height: integer(),
    title: text(),
    alt: text(),
    uploadedBy: text().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("media_kind_created_idx").on(t.kind, t.createdAt)],
);

export const galleries = pgTable("galleries", {
  id: id(),
  // Ключ для вставки галереи в контент.
  key: text().notNull().unique(),
  title: text().notNull(),
  ...timestamps,
});

export const galleryItems = pgTable(
  "gallery_items",
  {
    galleryId: integer()
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    mediaId: integer()
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sort: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.galleryId, t.mediaId] })],
);
