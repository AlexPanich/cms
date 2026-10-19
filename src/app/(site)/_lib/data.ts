import "server-only";
import { cache } from "react";
import { db } from "@/db";
import { FALLBACK_SITE_NAME, SITE_TEXT_KEYS } from "@/lib/site";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  getHomePage,
  getPublishedArticle,
  getPublishedPage,
  getSiteTexts,
} from "@/server/site/service";

// cache — чтобы generateMetadata и страница не ходили в БД дважды за один запрос.

export const getSiteInfo = cache(async () => {
  const texts = await getSiteTexts(db(), SITE_TEXT_KEYS);
  return {
    name: texts["site-name"] || FALLBACK_SITE_NAME,
    description: texts["site-description"],
    footer: texts.footer,
  };
});

// Сегменты URL проверяются по формату slug до запроса в БД.
export function pathFromSegments(segments: string[] | undefined): string | null {
  if (!segments?.length) return "";
  if (segments.length > 20 || !segments.every((segment) => SLUG_PATTERN.test(segment))) {
    return null;
  }
  return segments.join("/");
}

export const getPageForPath = cache(async (path: string) =>
  path === "" ? getHomePage(db()) : getPublishedPage(db(), path),
);

export const getArticleForSlug = cache(async (slug: string) =>
  SLUG_PATTERN.test(slug) ? getPublishedArticle(db(), slug) : null,
);
