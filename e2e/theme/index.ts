import type { ThemeModule } from "@/components/site/theme";
import { blockViews } from "./blocks/views";
import { Article, ArticleList, EmptySite, NotFound, Search } from "./pages";
import { SiteLayout } from "./shell";
import { templates } from "./templates";

// Тема для проверки контракта (CLAUDE.md рядом).
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
