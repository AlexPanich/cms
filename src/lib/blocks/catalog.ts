import { defineBlock, field } from "./define";

// Базовый каталог блоков ядра. Тема обязана нарисовать каждый, а свои типы добавляет
// в src/theme/blocks/. Блок, который пригодится другим клиентам, переносится сюда.

// Обычная текстовая страница — один такой блок.
export const textBlock = defineBlock({
  type: "text",
  label: "Текст",
  description: "Форматированный текст: заголовки, списки, ссылки, картинки, галереи",
  fields: {
    content: field.richText({ label: "Текст", required: true }),
  },
});

export const CORE_BLOCKS = [textBlock] as const;
