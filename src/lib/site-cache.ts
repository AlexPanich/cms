import type { Permission } from "./permissions";

// Теги кеша публичного сайта: по одному на тип данных. Кешированное чтение помечается тегами
// всех данных, из которых оно собрано (src/server/site/cached.ts).
export const SITE_CACHE_TAGS = {
  pages: "site:pages",
  menus: "site:menus",
  texts: "site:texts",
  articles: "site:articles",
  galleries: "site:galleries",
} as const;

export type SiteCacheTag = (typeof SITE_CACHE_TAGS)[keyof typeof SITE_CACHE_TAGS];

// Какие данные сайта может изменить действие с этим правом. runAction сбрасывает эти теги
// после каждого успешного действия — новый server action не нужно помнить об этом отдельно.
// Медиа: картинку могли удалить или поменять ей описание — она есть в галереях и превью статей.
export const SITE_CACHE_TAGS_BY_PERMISSION: Partial<Record<Permission, readonly SiteCacheTag[]>> = {
  edit_pages: [SITE_CACHE_TAGS.pages],
  edit_menus: [SITE_CACHE_TAGS.menus],
  edit_texts: [SITE_CACHE_TAGS.texts],
  edit_articles: [SITE_CACHE_TAGS.articles],
  edit_media: [SITE_CACHE_TAGS.galleries, SITE_CACHE_TAGS.articles],
  edit_from_front: [SITE_CACHE_TAGS.pages, SITE_CACHE_TAGS.texts],
};
