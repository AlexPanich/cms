import "server-only";
import { getSessionCookie } from "better-auth/cookies";
import { headers } from "next/headers";
import { cache } from "react";
import { can } from "@/lib/permissions";
import { FALLBACK_SITE_NAME } from "@/lib/site";
import { pageCount } from "@/lib/pagination";
import { SLUG_PATTERN } from "@/lib/slug";
import { getCurrentUser } from "@/server/auth/session";
import {
  cachedArticle,
  cachedArticles,
  cachedPage,
  cachedRouteIndex,
  cachedSiteTexts,
} from "@/server/site/cached";

// Данные публичных страниц — из кеша (src/server/site/cached.ts). Чтение по пути или slug
// идёт только для адресов из индекса опубликованного, иначе любой запрос на несуществующий
// адрес создавал бы новую запись в кеше.

export async function getSiteInfo() {
  const texts = await cachedSiteTexts();
  return {
    name: texts["site-name"] || FALLBACK_SITE_NAME,
    description: texts["site-description"],
    footer: texts.footer,
  };
}

// Сегменты URL проверяются по формату slug до запроса в БД.
export function pathFromSegments(segments: string[] | undefined): string | null {
  if (!segments?.length) return "";
  if (segments.length > 20 || !segments.every((segment) => SLUG_PATTERN.test(segment))) {
    return null;
  }
  return segments.join("/");
}

export async function getPageForPath(path: string) {
  if (path === "") return cachedPage("");
  const index = await cachedRouteIndex();
  return index.pagePaths.includes(path) ? cachedPage(path) : null;
}

export async function getArticleForSlug(slug: string) {
  if (!SLUG_PATTERN.test(slug)) return null;
  const index = await cachedRouteIndex();
  return index.articleSlugs.includes(slug) ? cachedArticle(slug) : null;
}

// null — номер страницы за пределами списка.
export async function getArticlesPage(page: number) {
  const index = await cachedRouteIndex();
  const pages = pageCount(index.articleSlugs.length);
  return page > pages ? null : { ...(await cachedArticles(page)), pageCount: pages };
}

// Пользователь с правом правки на сайте или null. Только для него рендерятся клиентские
// компоненты правки — остальным посетителям их код не отправляется. Гость без cookie
// сессии — без запроса в БД.
export const getFrontEditor = cache(async () => {
  if (!getSessionCookie(await headers())) return null;
  const user = await getCurrentUser();
  if (!can(user, "edit_from_front")) return null;
  return { canOpenAdmin: can(user, "view_admin") };
});
