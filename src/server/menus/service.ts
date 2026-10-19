import "server-only";
import { asc, count, eq, sql } from "drizzle-orm";
import { DomainError } from "@/server/errors";
import type { Executor, Tx } from "@/db";
import { menuItems, menus, pages } from "@/db/schema";
import { type MenuItemInput, menuItemInputSchema } from "./schema";

export type Menu = typeof menus.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;

export type MenuErrorCode =
  "menu_not_found" | "item_not_found" | "page_not_found" | "invalid_order";

export class MenuError extends DomainError<MenuErrorCode> {}

// Блокировка меню упорядочивает параллельные добавления и сортировку его пунктов.
async function lockMenu(tx: Tx, menuId: number) {
  const [menu] = await tx.select().from(menus).where(eq(menus.id, menuId)).for("update");
  if (!menu) throw new MenuError("menu_not_found", "Меню не найдено");
  return menu;
}

// Страницу блокируем на чтение, чтобы её не удалили до конца транзакции.
async function assertPageExists(tx: Tx, pageId: number | null) {
  if (pageId === null) return;
  const [page] = await tx
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.id, pageId))
    .for("share");
  if (!page) throw new MenuError("page_not_found", "Страница не найдена", "pageId");
}

export async function createMenuItem(
  executor: Executor,
  menuId: number,
  input: MenuItemInput,
): Promise<MenuItem> {
  const data = menuItemInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    await lockMenu(tx, menuId);
    await assertPageExists(tx, data.pageId);
    const [{ value: sort }] = await tx
      .select({ value: sql`coalesce(max(${menuItems.sort}) + 1, 0)`.mapWith(Number) })
      .from(menuItems)
      .where(eq(menuItems.menuId, menuId));
    const [item] = await tx
      .insert(menuItems)
      .values({ ...data, menuId, sort })
      .returning();
    return item;
  });
}

export async function updateMenuItem(
  executor: Executor,
  id: number,
  input: MenuItemInput,
): Promise<MenuItem> {
  const data = menuItemInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    await assertPageExists(tx, data.pageId);
    const [item] = await tx.update(menuItems).set(data).where(eq(menuItems.id, id)).returning();
    if (!item) throw new MenuError("item_not_found", "Пункт меню не найден");
    return item;
  });
}

export async function deleteMenuItem(executor: Executor, id: number): Promise<void> {
  const deleted = await executor
    .delete(menuItems)
    .where(eq(menuItems.id, id))
    .returning({ id: menuItems.id });
  if (deleted.length === 0) throw new MenuError("item_not_found", "Пункт меню не найден");
}

// orderedIds — полный список пунктов меню в новом порядке.
export async function reorderMenuItems(
  executor: Executor,
  menuId: number,
  orderedIds: readonly number[],
): Promise<void> {
  await executor.transaction(async (tx) => {
    await lockMenu(tx, menuId);
    const items = await tx
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(eq(menuItems.menuId, menuId));

    const expected = new Set(items.map((item) => item.id));
    const isPermutation =
      orderedIds.length === expected.size &&
      new Set(orderedIds).size === orderedIds.length &&
      orderedIds.every((id) => expected.has(id));
    if (!isPermutation) {
      throw new MenuError("invalid_order", "Список пунктов устарел, обновите страницу");
    }

    for (const [index, itemId] of orderedIds.entries()) {
      await tx.update(menuItems).set({ sort: index }).where(eq(menuItems.id, itemId));
    }
  });
}

export async function listMenus(executor: Executor) {
  return executor
    .select({ id: menus.id, key: menus.key, title: menus.title, itemCount: count(menuItems.id) })
    .from(menus)
    .leftJoin(menuItems, eq(menuItems.menuId, menus.id))
    .groupBy(menus.id)
    .orderBy(asc(menus.id));
}

export async function getMenu(executor: Executor, id: number): Promise<Menu | null> {
  const [menu] = await executor.select().from(menus).where(eq(menus.id, id));
  return menu ?? null;
}

export async function getMenuItem(executor: Executor, id: number): Promise<MenuItem | null> {
  const [item] = await executor.select().from(menuItems).where(eq(menuItems.id, id));
  return item ?? null;
}

// Пункты меню вместе со страницей, на которую они ссылаются.
// Название пункта: свой label, иначе название страницы в меню, иначе её заголовок.
export async function getMenuItems(executor: Executor, menuId: number) {
  const rows = await executor
    .select({
      id: menuItems.id,
      pageId: menuItems.pageId,
      url: menuItems.url,
      label: menuItems.label,
      page: {
        path: pages.path,
        title: pages.title,
        menuTitle: pages.menuTitle,
        published: pages.published,
        isHome: pages.isHome,
      },
    })
    .from(menuItems)
    .leftJoin(pages, eq(pages.id, menuItems.pageId))
    .where(eq(menuItems.menuId, menuId))
    .orderBy(asc(menuItems.sort), asc(menuItems.id));

  return rows.map(({ page, ...item }) => ({
    ...item,
    title: item.label ?? page?.menuTitle ?? page?.title ?? item.url ?? "",
    href: page ? (page.isHome ? "/" : `/${page.path}`) : (item.url ?? "/"),
    published: page?.published ?? true,
  }));
}

export type MenuItemView = Awaited<ReturnType<typeof getMenuItems>>[number];
