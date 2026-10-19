// Тексты, которые выводит общий лейаут сайта. Создаются сидом, правятся в разделе «Тексты».
export const SITE_TEXTS = [
  { key: "site-name", title: "Название сайта", body: "Мой сайт" },
  { key: "site-description", title: "Описание сайта для поисковиков", body: "" },
  { key: "footer", title: "Текст в подвале", body: "" },
] as const;

export type SiteTextKey = (typeof SITE_TEXTS)[number]["key"];

export const SITE_TEXT_KEYS = SITE_TEXTS.map((text) => text.key);

// Если название сайта скрыли или стёрли.
export const FALLBACK_SITE_NAME = "Сайт";

// Пункт меню активен на своей странице и на вложенных; «/» — только на главной.
export function isActiveHref(pathname: string, href: string): boolean {
  if (!href.startsWith("/")) return false;
  const path = href.split(/[?#]/)[0];
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}
