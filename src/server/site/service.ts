import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Executor } from "@/db";
import { articles, galleries, galleryItems, media, menus, pages, texts } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { PAGE_SIZE } from "@/lib/pagination";
import { classifySitePath } from "@/lib/site-routes";
import { getMenuItems } from "@/server/menus/service";

// Всё, что читает публичный сайт: только опубликованное.

const publishedPageFields = {
  id: pages.id,
  parentId: pages.parentId,
  path: pages.path,
  title: pages.title,
  metaDescription: pages.metaDescription,
  content: pages.content,
  template: pages.template,
  isHome: pages.isHome,
  updatedAt: pages.updatedAt,
};

export async function getPublishedPage(executor: Executor, path: string) {
  const [page] = await executor
    .select(publishedPageFields)
    .from(pages)
    .where(and(eq(pages.path, path), eq(pages.published, true)));
  return page ?? null;
}

export async function getHomePage(executor: Executor) {
  const [page] = await executor
    .select(publishedPageFields)
    .from(pages)
    .where(and(eq(pages.isHome, true), eq(pages.published, true)));
  return page ?? null;
}

export type PublishedPage = NonNullable<Awaited<ReturnType<typeof getPublishedPage>>>;

export const pageHref = (page: { path: string; isHome: boolean }) =>
  page.isHome ? "/" : `/${page.path}`;

// Опубликованные предки страницы по префиксам её пути — для хлебных крошек.
// Неопубликованный предок пропускается: ссылка на него вела бы на 404.
export async function getAncestors(executor: Executor, path: string) {
  const segments = path.split("/");
  const prefixes = segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join("/"));
  if (prefixes.length === 0) return [];
  const rows = await executor
    .select({
      path: pages.path,
      title: pages.title,
      menuTitle: pages.menuTitle,
      isHome: pages.isHome,
    })
    .from(pages)
    .where(and(inArray(pages.path, prefixes), eq(pages.published, true)));
  return rows
    .sort((a, b) => a.path.length - b.path.length)
    .map((row) => ({ href: pageHref(row), title: row.menuTitle ?? row.title }));
}

// Меню раздела: опубликованные страницы второго уровня ветки, в которой находится страница.
export async function getSectionMenu(executor: Executor, path: string) {
  const rootPath = path.split("/")[0];
  const [root] = await executor
    .select({
      id: pages.id,
      path: pages.path,
      title: pages.title,
      menuTitle: pages.menuTitle,
      isHome: pages.isHome,
    })
    .from(pages)
    .where(and(eq(pages.path, rootPath), isNull(pages.parentId), eq(pages.published, true)));
  if (!root) return null;
  const children = await executor
    .select({
      path: pages.path,
      title: pages.title,
      menuTitle: pages.menuTitle,
      isHome: pages.isHome,
    })
    .from(pages)
    .where(and(eq(pages.parentId, root.id), eq(pages.published, true)))
    .orderBy(asc(pages.sort), asc(pages.id));
  if (children.length === 0) return null;
  const item = (row: {
    path: string;
    title: string;
    menuTitle: string | null;
    isHome: boolean;
  }) => ({ href: pageHref(row), title: row.menuTitle ?? row.title });
  return { root: item(root), items: children.map(item) };
}

// Пункты меню по ключу. Пункты на неопубликованные страницы не показываются.
export async function getSiteMenu(executor: Executor, key: string) {
  const [menu] = await executor.select({ id: menus.id }).from(menus).where(eq(menus.key, key));
  if (!menu) return [];
  const items = await getMenuItems(executor, menu.id);
  return items
    .filter((item) => item.published)
    .map((item) => ({ id: item.id, title: item.title, href: item.href }));
}

export type SiteMenuItem = Awaited<ReturnType<typeof getSiteMenu>>[number];

// Тексты по ключам. Скрытый или отсутствующий текст — пустая строка.
export async function getSiteTexts<K extends string>(
  executor: Executor,
  keys: readonly K[],
): Promise<Record<K, string>> {
  const rows = await executor
    .select({ key: texts.key, body: texts.body })
    .from(texts)
    .where(and(inArray(texts.key, [...keys]), eq(texts.published, true)));
  const result = Object.fromEntries(keys.map((key) => [key, ""])) as Record<K, string>;
  for (const row of rows) result[row.key as K] = row.body;
  return result;
}

export async function getGalleriesByKeys(executor: Executor, keys: readonly string[]) {
  const result = new Map<string, PublicGallery>();
  if (keys.length === 0) return result;
  const rows = await executor
    .select({
      key: galleries.key,
      title: galleries.title,
      storageKey: media.storageKey,
      alt: media.alt,
      width: media.width,
      height: media.height,
    })
    .from(galleries)
    .leftJoin(galleryItems, eq(galleryItems.galleryId, galleries.id))
    .leftJoin(media, eq(media.id, galleryItems.mediaId))
    .where(inArray(galleries.key, [...keys]))
    .orderBy(asc(galleries.id), asc(galleryItems.sort), asc(galleryItems.mediaId));

  for (const row of rows) {
    let gallery = result.get(row.key);
    if (!gallery) {
      gallery = { title: row.title, images: [] };
      result.set(row.key, gallery);
    }
    if (row.storageKey) {
      gallery.images.push({
        url: mediaUrl(row.storageKey),
        alt: row.alt ?? "",
        width: row.width ?? 0,
        height: row.height ?? 0,
      });
    }
  }
  return result;
}

export type PublicGallery = {
  title: string;
  images: { url: string; alt: string; width: number; height: number }[];
};

const articleCardFields = {
  slug: articles.slug,
  title: articles.title,
  excerpt: articles.excerpt,
  publishedAt: articles.publishedAt,
  previewKey: media.storageKey,
  previewAlt: media.alt,
};

const withPreview = <T extends { previewKey: string | null }>({ previewKey, ...row }: T) => ({
  ...row,
  previewUrl: previewKey ? mediaUrl(previewKey) : null,
});

export async function listPublishedArticles(executor: Executor, { page }: { page: number }) {
  const where = eq(articles.published, true);
  const [rows, [{ total }]] = await Promise.all([
    executor
      .select(articleCardFields)
      .from(articles)
      .leftJoin(media, eq(media.id, articles.previewId))
      .where(where)
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(articles).where(where),
  ]);
  return { items: rows.map(withPreview), total };
}

export async function getPublishedArticle(executor: Executor, slug: string) {
  const [row] = await executor
    .select({ ...articleCardFields, content: articles.content, updatedAt: articles.updatedAt })
    .from(articles)
    .leftJoin(media, eq(media.id, articles.previewId))
    .where(and(eq(articles.slug, slug), eq(articles.published, true)));
  return row ? withPreview(row) : null;
}

// Маркеры подсветки в ts_headline. Результат выводится как текст, а не HTML:
// маркеры потом превращаются в <mark>, поэтому HTML в тексте ничего не сломает.
export const HIGHLIGHT_START = "\u0001";
export const HIGHLIGHT_END = "\u0002";

// Полнотекстовый поиск по опубликованным страницам и статьям. websearch_to_tsquery
// понимает запрос как в поисковике («слово -исключить "фраза"») и не падает на синтаксисе.
export async function searchSite(
  executor: Executor,
  { query, page }: { query: string; page: number },
) {
  const tsquery = sql`websearch_to_tsquery('russian', ${query})`;
  const headlineOptions = `StartSel=${HIGHLIGHT_START}, StopSel=${HIGHLIGHT_END}, MaxFragments=2, MaxWords=30, MinWords=10, FragmentDelimiter=" … "`;
  // Текст документа TipTap — значения полей «text», как в поисковом векторе.
  const plainText = (content: typeof pages.content | typeof articles.content) =>
    sql`(select string_agg(value #>> '{}', ' ') from jsonb_array_elements(coalesce(jsonb_path_query_array(${content}, 'strict $.**.text'), '[]'::jsonb)))`;
  const snippet = (
    description: typeof pages.metaDescription | typeof articles.excerpt,
    content: typeof pages.content | typeof articles.content,
  ) =>
    sql`ts_headline('russian', concat_ws(' ', ${description}, ${plainText(content)}), ${tsquery}, ${headlineOptions})`;

  const matches = sql`
    select 'page' as kind, ${pages.title} as title,
      case when ${pages.isHome} then '/' else '/' || ${pages.path} end as href,
      ${snippet(pages.metaDescription, pages.content)} as snippet,
      ts_rank(${pages.searchVector}, ${tsquery}) as rank
    from ${pages}
    where ${pages.published} and ${pages.searchVector} @@ ${tsquery}
    union all
    select 'article', ${articles.title}, '/articles/' || ${articles.slug},
      ${snippet(articles.excerpt, articles.content)},
      ts_rank(${articles.searchVector}, ${tsquery})
    from ${articles}
    where ${articles.published} and ${articles.searchVector} @@ ${tsquery}`;

  const [rows, [{ total }]] = await Promise.all([
    executor.execute<{ kind: "page" | "article"; title: string; href: string; snippet: string }>(
      sql`select kind, title, href, snippet from (${matches}) as matches
        order by rank desc, title limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
    ),
    executor.execute<{ total: number }>(
      sql`select count(*)::int as total from (${matches}) as matches`,
    ),
  ]);
  return { items: [...rows], total };
}

export type SearchResult = Awaited<ReturnType<typeof searchSite>>["items"][number];

export async function getSitemapEntries(executor: Executor) {
  const [pageRows, articleRows] = await Promise.all([
    executor
      .select({ path: pages.path, isHome: pages.isHome, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.published, true))
      .orderBy(asc(pages.path)),
    executor
      .select({ slug: articles.slug, updatedAt: articles.updatedAt })
      .from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.publishedAt)),
  ]);
  return [
    ...pageRows.map((row) => ({ path: pageHref(row), updatedAt: row.updatedAt })),
    ...articleRows.map((row) => ({ path: `/articles/${row.slug}`, updatedAt: row.updatedAt })),
  ];
}

export type RouteResolution =
  { status: "ok" } | { status: "not_found" } | { status: "redirect"; location: string };

// Для proxy: есть ли по адресу опубликованная страница или статья. У главной один адрес — «/».
export async function resolveSiteRoute(
  executor: Executor,
  pathname: string,
): Promise<RouteResolution> {
  const route = classifySitePath(pathname);
  switch (route.kind) {
    case "other":
      return { status: "ok" };
    case "invalid":
      return { status: "not_found" };
    case "article": {
      const [row] = await executor
        .select({ id: articles.id })
        .from(articles)
        .where(and(eq(articles.slug, route.slug), eq(articles.published, true)));
      return row ? { status: "ok" } : { status: "not_found" };
    }
    case "page": {
      const [row] = await executor
        .select({ isHome: pages.isHome })
        .from(pages)
        .where(and(eq(pages.path, route.path), eq(pages.published, true)));
      if (!row) return { status: "not_found" };
      return row.isHome ? { status: "redirect", location: "/" } : { status: "ok" };
    }
  }
}
