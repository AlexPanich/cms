import { PAGE_TEMPLATES } from "@/theme/page-templates";

// Реестр шаблонов страниц объявляет тема (src/theme/page-templates.ts), лейауты —
// src/theme/templates.tsx. Ключ хранится в pages.template.
export type PageTemplateDefinition = { key: string; label: string; description: string };

export { PAGE_TEMPLATES };

export type PageTemplate = (typeof PAGE_TEMPLATES)[number]["key"];

// Без шаблона "default" тема не соберётся.
export const DEFAULT_PAGE_TEMPLATE = "default" satisfies PageTemplate;

export const PAGE_TEMPLATE_KEYS = PAGE_TEMPLATES.map((template) => template.key) as [
  PageTemplate,
  ...PageTemplate[],
];

export function isPageTemplate(value: string): value is PageTemplate {
  return (PAGE_TEMPLATE_KEYS as string[]).includes(value);
}

// Шаблон из БД мог пропасть из реестра (тему сменили или шаблон удалили) — тогда стандартный.
export function resolvePageTemplate(value: string): PageTemplate {
  return isPageTemplate(value) ? value : DEFAULT_PAGE_TEMPLATE;
}
