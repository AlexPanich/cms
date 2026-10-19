// Реестр шаблонов страниц. Лейаут для каждого ключа — в теме (src/theme/templates.tsx).
export const PAGE_TEMPLATES = [
  { key: "default", label: "Стандартный", description: "Текст и меню раздела сбоку" },
  { key: "wide", label: "Широкий", description: "Контент на всю ширину, без бокового меню" },
] as const;

export type PageTemplate = (typeof PAGE_TEMPLATES)[number]["key"];

export const PAGE_TEMPLATE_KEYS = PAGE_TEMPLATES.map((template) => template.key) as [
  PageTemplate,
  ...PageTemplate[],
];

export function isPageTemplate(value: string): value is PageTemplate {
  return (PAGE_TEMPLATE_KEYS as string[]).includes(value);
}
