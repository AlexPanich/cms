import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import {
  articles,
  galleries,
  galleryItems,
  media,
  menuItems,
  menus,
  pages,
  texts,
} from "@/db/schema";
import type { RichTextDoc } from "@/lib/rich-text";
import { withRollback as withRollbackBase } from "@/test/db";
import {
  getAncestors,
  getGalleriesByKeys,
  getHomePage,
  getPublishedArticle,
  getPublishedPage,
  getSectionMenu,
  getSiteMenu,
  getSitemapEntries,
  getSiteTexts,
  HIGHLIGHT_END,
  HIGHLIGHT_START,
  listPublishedArticles,
  resolveSiteRoute,
  searchSite,
} from "./service";

// Тесты сравнивают списки, поэтому начинают с пустых таблиц.
const withRollback = (fn: (tx: Tx) => Promise<void>) =>
  withRollbackBase(fn, { clear: [menus, pages, articles, texts, galleries, media] });

const doc = (...paragraphs: string[]): RichTextDoc => ({
  type: "doc",
  content: paragraphs.map((text) => ({
    type: "paragraph",
    content: [{ type: "text", text }],
  })),
});

type PageRow = typeof pages.$inferInsert;

async function insertPage(tx: Tx, values: Omit<PageRow, "slug" | "title"> & { title?: string }) {
  const slug = values.path.split("/").pop() ?? "";
  const [page] = await tx
    .insert(pages)
    .values({ slug, title: slug, published: true, ...values })
    .returning();
  return page;
}

describe("публичный сайт", () => {
  it("отдаёт только опубликованные страницы, главная — по флагу", () =>
    withRollback(async (tx) => {
      await insertPage(tx, { path: "home", isHome: true });
      await insertPage(tx, { path: "draft", published: false });
      expect((await getHomePage(tx))?.path).toBe("home");
      expect(await getPublishedPage(tx, "draft")).toBeNull();
      expect((await getPublishedPage(tx, "home"))?.isHome).toBe(true);
    }));

  it("строит хлебные крошки и меню раздела, пропуская неопубликованное", () =>
    withRollback(async (tx) => {
      const about = await insertPage(tx, { path: "about", title: "О нас", menuTitle: "Компания" });
      const team = await insertPage(tx, { path: "about/team", parentId: about.id, sort: 1 });
      await insertPage(tx, { path: "about/jobs", parentId: about.id, sort: 0 });
      await insertPage(tx, { path: "about/hidden", parentId: about.id, published: false });
      await insertPage(tx, { path: "about/team/anna", parentId: team.id });

      expect(await getAncestors(tx, "about/team/anna")).toEqual([
        { href: "/about", title: "Компания" },
        { href: "/about/team", title: "team" },
      ]);
      expect(await getAncestors(tx, "about")).toEqual([]);
      expect(await getSectionMenu(tx, "about/team/anna")).toEqual({
        root: { href: "/about", title: "Компания" },
        items: [
          { href: "/about/jobs", title: "jobs" },
          { href: "/about/team", title: "team" },
        ],
      });
      await insertPage(tx, { path: "contacts" });
      expect(await getSectionMenu(tx, "contacts")).toBeNull();
    }));

  it("меню без пунктов на неопубликованные страницы, тексты без скрытых", () =>
    withRollback(async (tx) => {
      const shown = await insertPage(tx, { path: "shown" });
      const hidden = await insertPage(tx, { path: "hidden", published: false });
      const [menu] = await tx.insert(menus).values({ key: "main", title: "Главное" }).returning();
      await tx.insert(menuItems).values([
        { menuId: menu.id, pageId: shown.id, sort: 0 },
        { menuId: menu.id, pageId: hidden.id, sort: 1 },
        { menuId: menu.id, url: "https://example.com", label: "Пример", sort: 2 },
      ]);
      expect(await getSiteMenu(tx, "main")).toMatchObject([
        { title: "shown", href: "/shown" },
        { title: "Пример", href: "https://example.com" },
      ]);
      expect(await getSiteMenu(tx, "missing")).toEqual([]);

      await tx.insert(texts).values([
        { key: "phone", title: "Телефон", body: "+7 900" },
        { key: "slogan", title: "Слоган", body: "секрет", published: false },
      ]);
      expect(await getSiteTexts(tx, ["phone", "slogan", "missing"])).toEqual({
        phone: "+7 900",
        slogan: "",
        missing: "",
      });
    }));

  it("загружает галереи по ключам с картинками по порядку", () =>
    withRollback(async (tx) => {
      const [office, empty] = await tx
        .insert(galleries)
        .values([
          { key: "office", title: "Офис" },
          { key: "empty", title: "Пусто" },
        ])
        .returning();
      const images = await tx
        .insert(media)
        .values(
          ["a", "b"].map((name) => ({
            kind: "image" as const,
            storageKey: `images/2026/01/${name}`,
            originalName: name,
            mimeType: "image/webp",
            size: 1,
            width: 10,
            height: 5,
            alt: name === "a" ? "Первая" : null,
          })),
        )
        .returning();
      await tx.insert(galleryItems).values([
        { galleryId: office.id, mediaId: images[0].id, sort: 1 },
        { galleryId: office.id, mediaId: images[1].id, sort: 0 },
      ]);

      const result = await getGalleriesByKeys(tx, ["office", "empty", "missing"]);
      expect(result.get("office")).toEqual({
        title: "Офис",
        images: [
          { url: "/media/images/2026/01/b", alt: "", width: 10, height: 5 },
          { url: "/media/images/2026/01/a", alt: "Первая", width: 10, height: 5 },
        ],
      });
      expect(result.get(empty.key)).toEqual({ title: "Пусто", images: [] });
      expect(result.has("missing")).toBe(false);
    }));

  it("показывает только опубликованные статьи, новые сверху", () =>
    withRollback(async (tx) => {
      await tx.insert(articles).values([
        { slug: "old", title: "Старая", published: true, publishedAt: new Date("2026-01-01") },
        { slug: "new", title: "Новая", published: true, publishedAt: new Date("2026-02-01") },
        { slug: "draft", title: "Черновик" },
      ]);
      const { items, total } = await listPublishedArticles(tx, { page: 1 });
      expect(total).toBe(2);
      expect(items.map((item) => item.slug)).toEqual(["new", "old"]);
      expect(await getPublishedArticle(tx, "draft")).toBeNull();
      expect(await getPublishedArticle(tx, "new")).toMatchObject({
        title: "Новая",
        previewUrl: null,
      });
    }));

  it("ищет по страницам и статьям с учётом морфологии и подсвечивает совпадения", () =>
    withRollback(async (tx) => {
      await insertPage(tx, {
        path: "offices",
        title: "Наши офисы",
        content: doc("Мы работаем в Москве и Казани."),
      });
      await insertPage(tx, { path: "contacts", title: "Контакты", content: doc("Офис в Москве") });
      await insertPage(tx, { path: "draft", title: "Офис-черновик", published: false });
      await tx.insert(articles).values({
        slug: "opening",
        title: "Открытие",
        excerpt: "Открыли новый офис",
        published: true,
      });

      const { items, total } = await searchSite(tx, { query: "офисе", page: 1 });
      expect(total).toBe(3);
      // Совпадение в заголовке весит больше, чем в тексте.
      expect(items[0]).toMatchObject({ kind: "page", title: "Наши офисы", href: "/offices" });
      expect(items.map((item) => item.href).sort()).toEqual([
        "/articles/opening",
        "/contacts",
        "/offices",
      ]);
      expect(items.find((item) => item.href === "/contacts")?.snippet).toBe(
        `${HIGHLIGHT_START}Офис${HIGHLIGHT_END} в Москве`,
      );

      expect((await searchSite(tx, { query: "москва -казань", page: 1 })).items).toMatchObject([
        { href: "/contacts" },
      ]);
      // Ссылки и служебные поля документа не индексируются.
      expect((await searchSite(tx, { query: "paragraph", page: 1 })).total).toBe(0);
      // Запрос — параметр, а не часть SQL.
      for (const query of ["'; drop table pages; --", "!!! & | (", ""]) {
        expect((await searchSite(tx, { query, page: 1 })).total).toBe(0);
      }
    }));

  it("собирает sitemap из опубликованного", () =>
    withRollback(async (tx) => {
      await insertPage(tx, { path: "home", isHome: true });
      await insertPage(tx, { path: "about" });
      await insertPage(tx, { path: "draft", published: false });
      await tx.insert(articles).values([
        { slug: "news", title: "Новость", published: true, publishedAt: new Date() },
        { slug: "draft", title: "Черновик" },
      ]);
      expect((await getSitemapEntries(tx)).map((entry) => entry.path)).toEqual([
        "/about",
        "/",
        "/articles/news",
      ]);
    }));

  it("решает для proxy, отдать страницу, 404 или перенаправить", () =>
    withRollback(async (tx) => {
      await insertPage(tx, { path: "home", isHome: true });
      const about = await insertPage(tx, { path: "about" });
      await insertPage(tx, { path: "about/team", parentId: about.id });
      await insertPage(tx, { path: "draft", published: false });
      await tx.insert(articles).values([
        { slug: "news", title: "Новость", published: true, publishedAt: new Date() },
        { slug: "draft", title: "Черновик" },
      ]);

      const resolve = (pathname: string) => resolveSiteRoute(tx, pathname);
      for (const pathname of [
        "/",
        "/about",
        "/about/team",
        "/articles",
        "/articles/news",
        "/search",
      ]) {
        expect(await resolve(pathname), pathname).toEqual({ status: "ok" });
      }
      for (const pathname of ["/draft", "/missing", "/about/missing", "/articles/draft", "/Bad"]) {
        expect(await resolve(pathname), pathname).toEqual({ status: "not_found" });
      }
      expect(await resolve("/home")).toEqual({ status: "redirect", location: "/" });
    }));
});
