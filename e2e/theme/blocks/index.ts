import type { BlockDefinition, BlockVariants } from "@/lib/blocks/define";
import { defineBlock, field } from "@/lib/blocks/define";
import { exampleImage } from "@/lib/blocks/examples";

export const quoteBlock = defineBlock({
  type: "quote",
  label: "Цитата",
  description: "Отзыв клиента или цитата с автором и фото",
  fields: {
    text: field.text({ label: "Цитата", required: true, max: 500, multiline: true }),
    author: field.text({ label: "Автор", max: 120 }),
    photo: field.image({ label: "Фото", aspect: 1 }),
  },
  example: {
    text: "Кухню собрали за один день, и через год она выглядит как новая. Спасибо мастерам!",
    author: "Анна, заказала кухню в 2025 году",
    photo: exampleImage(2),
  },
});

export const THEME_BLOCKS = [quoteBlock] as const satisfies readonly BlockDefinition[];

export const BLOCK_VARIANTS: BlockVariants = {
  hero: [{ key: "centered", label: "По центру" }],
  quote: [{ key: "large", label: "Крупно" }],
};
