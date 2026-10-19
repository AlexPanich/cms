import type { ComponentType, ReactNode } from "react";
import type { PageTemplate } from "@/lib/templates";
import type {
  PublishedArticle,
  PublishedArticleCard,
  PublishedPage,
  SearchResult,
  SiteMenuItem,
} from "@/server/site/service";
import type { ContentContext } from "./rich-text";

// Контракт темы. Ядро (src/app/(site)) загружает данные, ставит метаданные и JSON-LD,
// а разметку берёт из темы (src/theme, импорт `@/theme`). Тема только рисует: данные
// приходят пропсами, а для правки на сайте и вывода текста есть компоненты из
// src/components/site (editable.tsx, rich-text.tsx).
//
// Обязательно для любой темы — на это опираются доступность и E2E:
// landmarks banner, navigation, main (id="content"), contentinfo; ссылка «К содержимому»;
// h1 на каждой странице; обёртки Editable… вокруг полей, которые правятся на сайте.

export type SiteInfo = { name: string; description: string; footer: string };

export type Crumb = { href: string; title: string };

export type SiteLayoutProps = {
  site: SiteInfo;
  mainMenu: SiteMenuItem[];
  footerMenu: SiteMenuItem[];
  children: ReactNode;
};

export type PageTemplateProps = {
  page: PublishedPage;
  // Адрес страницы на сайте.
  href: string;
  // Опубликованные предки, без главной. У главной пусто.
  crumbs: Crumb[];
  // Меню ветки, если у неё есть подстраницы.
  section: { root: Crumb; items: Crumb[] } | null;
  context: ContentContext;
};

export type ArticleListProps = {
  articles: PublishedArticleCard[];
  page: number;
  pageCount: number;
};

export type ArticleProps = {
  article: PublishedArticle;
  crumbs: Crumb[];
  context: ContentContext;
};

// Фрагмент результата поиска: совпадения отмечены match, текст выводится как текст.
export type HighlightPart = { text: string; match: boolean };

export type SearchProps = {
  query: string;
  results: (Omit<SearchResult, "snippet"> & { snippet: HighlightPart[] | null })[];
  total: number;
  page: number;
  pageCount: number;
};

export type ThemeModule = {
  // Оболочка всех публичных страниц: шапка, main, подвал.
  SiteLayout: ComponentType<SiteLayoutProps>;
  // Лейаут для каждого шаблона страницы из src/lib/templates.ts.
  templates: Record<PageTemplate, ComponentType<PageTemplateProps>>;
  ArticleList: ComponentType<ArticleListProps>;
  Article: ComponentType<ArticleProps>;
  Search: ComponentType<SearchProps>;
  NotFound: ComponentType;
  // Свежая установка: главная страница ещё не назначена.
  EmptySite: ComponentType;
};
