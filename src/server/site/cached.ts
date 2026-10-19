import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { SITE_CACHE_TAGS as TAGS } from "@/lib/site-cache";
import { SITE_TEXT_KEYS } from "@/lib/site";
import {
  getAncestors,
  getGalleriesByKeys,
  getHomePage,
  getPageLinks,
  getPublishedArticle,
  getPublishedPage,
  getSectionMenu,
  getSiteMenu,
  getSitemapEntries,
  getSiteTexts,
  listPublishedArticles,
  type PageLink,
  type PublicGallery,
  getRouteIndex,
} from "./service";

// Кешированные чтения публичного сайта. Кеш общий для всех запросов (в памяти процесса),
// сбрасывается по тегам после правок в админке (runAction) и раз в час обновляется сам —
// на случай правок в обход админки. Тег — каждый тип данных, из которого собран результат.
// Аргументы — ключ кеша, поэтому только простые значения.

export async function cachedSiteTexts() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.texts);
  return getSiteTexts(db(), SITE_TEXT_KEYS);
}

export async function cachedPage(path: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages);
  return path === "" ? getHomePage(db()) : getPublishedPage(db(), path);
}

export async function cachedAncestors(path: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages);
  return getAncestors(db(), path);
}

export async function cachedSectionMenu(path: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages);
  return getSectionMenu(db(), path);
}

// Название пункта меню берётся из страницы, а пункты на черновики скрыты — поэтому и тег страниц.
export async function cachedSiteMenu(key: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.menus, TAGS.pages);
  return getSiteMenu(db(), key);
}

// Map в кеш не кладём — пары [ключ, галерея].
export async function cachedGalleries(keys: string[]): Promise<[string, PublicGallery][]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.galleries);
  return [...(await getGalleriesByKeys(db(), keys))];
}

// id по порядку — ключ кеша; пары [id, ссылка], как у галерей.
export async function cachedPageLinks(ids: number[]): Promise<[number, PageLink][]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages);
  return [...(await getPageLinks(db(), ids))];
}

export async function cachedArticles(page: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles);
  return listPublishedArticles(db(), { page });
}

export async function cachedArticle(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles);
  return getPublishedArticle(db(), slug);
}

export async function cachedSitemapEntries() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages, TAGS.articles);
  return getSitemapEntries(db());
}

// Одна запись на весь сайт. Остальные чтения по пути или slug вызываются только для адресов
// из индекса, поэтому запросы на несуществующие адреса не засоряют кеш.
export async function cachedRouteIndex() {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.pages, TAGS.articles);
  return getRouteIndex(db());
}
