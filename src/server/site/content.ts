import "server-only";
import type { ContentContext } from "@/components/site/rich-text";
import { collectGalleryKeys, type RichTextDoc } from "@/lib/rich-text";
import { cachedGalleries } from "./cached";

// Загружает данные всех виджетов документа заранее — одним (кешированным) запросом на тип виджета.
export async function loadContentContext(doc: RichTextDoc | null): Promise<ContentContext> {
  // Ключи по порядку — чтобы один и тот же набор галерей был одной записью в кеше.
  const keys = collectGalleryKeys(doc).sort();
  return { galleries: new Map(keys.length > 0 ? await cachedGalleries(keys) : []) };
}
