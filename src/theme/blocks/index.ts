import type { BlockDefinition, BlockVariants } from "@/lib/blocks/define";

// Блоки этой темы. Файл без серверных зависимостей: его импортируют форма в браузере
// и реестр блоков (src/lib/blocks/registry.ts).

// Свои типы блоков — через defineBlock, когда в каталоге ядра нет ничего похожего.
// Тип не должен совпадать с типом блока ядра.
export const THEME_BLOCKS = [] as const satisfies readonly BlockDefinition[];

// Варианты оформления по типу блока: { "media-text": [{ key: "image-right", label: … }] }.
export const BLOCK_VARIANTS: BlockVariants = {
  "media-text": [{ key: "image-right", label: "Картинка справа" }],
  cta: [{ key: "light", label: "На светлом фоне" }],
};
