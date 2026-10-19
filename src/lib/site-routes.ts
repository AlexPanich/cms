import { RESERVED_ROOT_SLUGS, SLUG_PATTERN } from "./slug";

// Что за адрес публичного сайта — без обращения к БД. Используется в proxy, чтобы отдать
// настоящий 404 или 308 до рендера: стриминг страниц статус ответа поменять уже не может.
export type SiteRoute =
  | { kind: "page"; path: string }
  | { kind: "article"; slug: string }
  | { kind: "articleList" }
  // Главная, поиск и разделы приложения: проверять нечего.
  | { kind: "other" }
  | { kind: "invalid" };

const MAX_DEPTH = 20;

// Каталог блоков темы для дизайнера (src/app/(catalog)). Подчёркивание не бывает в slug,
// поэтому адрес не пересекается со страницами.
export const BLOCK_CATALOG_PATH = "/_blocks";

export function classifySitePath(pathname: string): SiteRoute {
  if (pathname === "/" || pathname === BLOCK_CATALOG_PATH) return { kind: "other" };
  // Слэш в конце Next сам перенаправляет на адрес без него.
  const segments = pathname.slice(1).split("/");
  const [first] = segments;

  if (first === "articles") {
    if (segments.length === 1) return { kind: "articleList" };
    return segments.length === 2 && SLUG_PATTERN.test(segments[1])
      ? { kind: "article", slug: segments[1] }
      : { kind: "invalid" };
  }
  if (RESERVED_ROOT_SLUGS.includes(first)) return { kind: "other" };
  if (segments.length > MAX_DEPTH || !segments.every((segment) => SLUG_PATTERN.test(segment))) {
    return { kind: "invalid" };
  }
  return { kind: "page", path: segments.join("/") };
}
