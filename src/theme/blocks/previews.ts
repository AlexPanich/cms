import type { StaticImageData } from "next/image";
import type { BlockType } from "@/lib/blocks/registry";
import text from "./previews/text.svg";

// Картинки-превью блоков для каталога в редакторе: схема того, как блок выглядит в этой
// теме. Импортирует только редактор в админке. Блок без превью показывается без картинки.
export const BLOCK_PREVIEWS: Partial<Record<BlockType, StaticImageData>> = {
  text,
};
