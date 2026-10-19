import type { ThemeModule } from "@/components/site/theme";
import { Article, ArticleList } from "./articles";
import { blockViews } from "./blocks/views";
import { EmptySite, NotFound } from "./not-found";
import { Search } from "./search";
import { SiteLayout } from "./site-layout";
import { templates } from "./templates";

// Тема сайта: вся разметка и оформление публичной части. Контракт и правила —
// src/components/site/theme.ts. В репозитории клиента дизайн меняется только здесь.
export const theme: ThemeModule = {
  SiteLayout,
  templates,
  blocks: blockViews,
  ArticleList,
  Article,
  Search,
  NotFound,
  EmptySite,
};
