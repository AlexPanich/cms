import "server-only";
import type { ContentContext } from "@/components/site/rich-text";
import type { Executor } from "@/db";
import { collectGalleryKeys, type RichTextDoc } from "@/lib/rich-text";
import { getGalleriesByKeys } from "./service";

// Загружает данные всех виджетов документа заранее — одним запросом на тип виджета.
export async function loadContentContext(
  executor: Executor,
  doc: RichTextDoc | null,
): Promise<ContentContext> {
  return { galleries: await getGalleriesByKeys(executor, collectGalleryKeys(doc)) };
}
