import type { StaticImageData } from "next/image";
import type { BlockType } from "@/lib/blocks/registry";
import articles from "./previews/articles.svg";
import cta from "./previews/cta.svg";
import documents from "./previews/documents.svg";
import faq from "./previews/faq.svg";
import features from "./previews/features.svg";
import gallery from "./previews/gallery.svg";
import hero from "./previews/hero.svg";
import mediaText from "./previews/media-text.svg";
import text from "./previews/text.svg";

// Картинки-превью блоков для каталога в редакторе: схема того, как блок выглядит в этой
// теме. Импортирует только редактор в админке. Блок без превью показывается без картинки.
export const BLOCK_PREVIEWS: Partial<Record<BlockType, StaticImageData>> = {
  text,
  hero,
  features,
  "media-text": mediaText,
  gallery,
  cta,
  faq,
  articles,
  documents,
};
