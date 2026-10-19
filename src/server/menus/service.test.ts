import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { menus, pages } from "@/db/schema";
import { withRollback } from "@/test/db";
import { menuItemInputSchema } from "./schema";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItems,
  listMenus,
  MenuError,
  type MenuErrorCode,
  reorderMenuItems,
  updateMenuItem,
} from "./service";

async function expectMenuError(promise: Promise<unknown>, code: MenuErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof MenuError && error.code === code,
  );
}

// Своё меню и страница, чтобы не зависеть от данных dev-базы.
async function setup(tx: Tx) {
  const [menu] = await tx.insert(menus).values({ key: "test-menu", title: "Тестовое" }).returning();
  const [page] = await tx
    .insert(pages)
    .values({ slug: "test-about", path: "test-about", title: "О компании", menuTitle: "О нас" })
    .returning();
  return { menuId: menu.id, pageId: page.id };
}

const titles = async (tx: Tx, menuId: number) =>
  (await getMenuItems(tx, menuId)).map((item) => item.title);

describe("menuItemInputSchema", () => {
  it("приводит пункт к виду для хранения", () => {
    expect(
      menuItemInputSchema.parse({ kind: "page", pageId: 1, url: "/лишнее", label: " " }),
    ).toEqual({ pageId: 1, url: null, label: null });
    expect(
      menuItemInputSchema.parse({ kind: "url", pageId: 1, url: " /contacts ", label: "Контакты" }),
    ).toEqual({ pageId: null, url: "/contacts", label: "Контакты" });
  });

  it("требует страницу, безопасную ссылку и название ссылки", () => {
    const issues = (value: unknown) =>
      menuItemInputSchema.safeParse(value).error?.issues.map((issue) => issue.path.join("."));
    expect(issues({ kind: "page" })).toEqual(["pageId"]);
    expect(issues({ kind: "url", url: "javascript:alert(1)" })).toEqual(["url", "label"]);
  });
});

describe("menus service", () => {
  it("добавляет пункты в конец и берёт название страницы, если своего нет", () =>
    withRollback(async (tx) => {
      const { menuId, pageId } = await setup(tx);
      await createMenuItem(tx, menuId, { kind: "page", pageId });
      await createMenuItem(tx, menuId, { kind: "url", url: "https://example.com", label: "Сайт" });
      await createMenuItem(tx, menuId, { kind: "page", pageId, label: "Своё" });

      const items = await getMenuItems(tx, menuId);
      expect(items.map((item) => [item.title, item.href])).toEqual([
        ["О нас", "/test-about"],
        ["Сайт", "https://example.com"],
        ["Своё", "/test-about"],
      ]);
    }));

  it("ставит новый пункт после последнего, даже если в порядке есть дыры", () =>
    withRollback(async (tx) => {
      const { menuId } = await setup(tx);
      const link = (label: string) => ({ kind: "url" as const, url: "/", label });
      const a = await createMenuItem(tx, menuId, link("a"));
      await createMenuItem(tx, menuId, link("b"));
      await deleteMenuItem(tx, a.id);
      await createMenuItem(tx, menuId, link("c"));
      expect(await titles(tx, menuId)).toEqual(["b", "c"]);
    }));

  it("проверяет меню и страницу", () =>
    withRollback(async (tx) => {
      const { menuId } = await setup(tx);
      await expectMenuError(
        createMenuItem(tx, 2_000_000_000, { kind: "url", url: "/", label: "x" }),
        "menu_not_found",
      );
      await expectMenuError(
        createMenuItem(tx, menuId, { kind: "page", pageId: 2_000_000_000 }),
        "page_not_found",
      );
    }));

  it("меняет ссылку на страницу на произвольную и обратно", () =>
    withRollback(async (tx) => {
      const { menuId, pageId } = await setup(tx);
      const item = await createMenuItem(tx, menuId, { kind: "page", pageId });
      const updated = await updateMenuItem(tx, item.id, {
        kind: "url",
        url: "mailto:info@example.com",
        label: "Почта",
      });
      expect(updated).toMatchObject({ pageId: null, url: "mailto:info@example.com" });
      await expectMenuError(
        updateMenuItem(tx, 2_000_000_000, { kind: "page", pageId }),
        "item_not_found",
      );
    }));

  it("меняет порядок только полной перестановкой", () =>
    withRollback(async (tx) => {
      const { menuId } = await setup(tx);
      const link = (label: string) => ({ kind: "url" as const, url: "/", label });
      const a = await createMenuItem(tx, menuId, link("a"));
      const b = await createMenuItem(tx, menuId, link("b"));
      const c = await createMenuItem(tx, menuId, link("c"));

      await reorderMenuItems(tx, menuId, [c.id, a.id, b.id]);
      expect(await titles(tx, menuId)).toEqual(["c", "a", "b"]);

      await expectMenuError(reorderMenuItems(tx, menuId, [a.id, b.id]), "invalid_order");
      await expectMenuError(reorderMenuItems(tx, menuId, [a.id, a.id, b.id]), "invalid_order");
    }));

  it("удаляет пункт вместе со страницей и считает пункты в списке меню", () =>
    withRollback(async (tx) => {
      const { menuId, pageId } = await setup(tx);
      await createMenuItem(tx, menuId, { kind: "page", pageId });
      await createMenuItem(tx, menuId, { kind: "url", url: "/", label: "Главная" });
      await tx.delete(pages).where(eq(pages.id, pageId));

      expect(await titles(tx, menuId)).toEqual(["Главная"]);
      const menu = (await listMenus(tx)).find((m) => m.id === menuId);
      expect(menu?.itemCount).toBe(1);
    }));
});
