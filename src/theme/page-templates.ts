import type { PageTemplateDefinition } from "@/lib/templates";

// Шаблоны страниц этой темы: редактор выбирает их в форме страницы. Лейаут для каждого
// ключа — в templates.tsx. Файл без зависимостей: его импортирует форма в браузере.
// Ключ "default" обязателен — им рисуется страница, чей шаблон пропал из списка.
export const PAGE_TEMPLATES = [
  { key: "default", label: "Стандартный", description: "Текст и меню раздела сбоку" },
  { key: "wide", label: "Широкий", description: "Контент на всю ширину, без бокового меню" },
] as const satisfies readonly PageTemplateDefinition[];
