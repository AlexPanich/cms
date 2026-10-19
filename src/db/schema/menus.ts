import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamps } from "./columns";
import { pages } from "./pages";

export const menus = pgTable("menus", {
  id: id(),
  // Ключ, по которому шаблон находит меню: «main», «footer».
  key: text().notNull().unique(),
  title: text().notNull(),
  ...timestamps,
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: id(),
    menuId: integer()
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    pageId: integer().references(() => pages.id, { onDelete: "cascade" }),
    url: text(),
    // Пустой label у ссылки на страницу — берётся menuTitle или title страницы.
    label: text(),
    sort: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("menu_items_menu_sort_idx").on(t.menuId, t.sort),
    check("menu_items_target", sql`(${t.pageId} is null) <> (${t.url} is null)`),
    check("menu_items_url_label", sql`${t.url} is null or ${t.label} is not null`),
  ],
);
