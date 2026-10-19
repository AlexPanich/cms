import type { RichTextWidgets } from "@/components/site/rich-text";
import { Gallery } from "./gallery";

// Оформление текста из редактора и виджетов в нём — общее для страниц и статей.
export const PROSE = "prose prose-neutral dark:prose-invert max-w-none";

export const WIDGETS: RichTextWidgets = { gallery: Gallery };
