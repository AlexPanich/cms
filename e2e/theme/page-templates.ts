import type { PageTemplateDefinition } from "@/lib/templates";

// Шаблона «wide» из темы по умолчанию здесь нет: страницы с ним рисуются как default.
export const PAGE_TEMPLATES = [
  { key: "default", label: "Обычный", description: "Крошки, заголовок и меню раздела снизу" },
  { key: "landing", label: "Лендинг", description: "Только блоки, без крошек и меню раздела" },
] as const satisfies readonly PageTemplateDefinition[];
