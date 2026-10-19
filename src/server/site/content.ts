import "server-only";
import type { ContentContext } from "@/components/site/rich-text";
import { type Block, collectBlockGalleryKeys, collectBlockPageIds } from "@/lib/blocks/registry";
import { collectGalleryKeys, type RichTextDoc } from "@/lib/rich-text";
import { cachedGalleries, cachedPageLinks } from "./cached";

// Загружает данные виджетов и ссылок заранее — одним (кешированным) запросом на тип данных.
// Ключи и id по порядку — чтобы один и тот же набор был одной записью в кеше.
async function loadContext(galleryKeys: string[], pageIds: number[]): Promise<ContentContext> {
  galleryKeys.sort();
  pageIds.sort((a, b) => a - b);
  const [galleries, links] = await Promise.all([
    galleryKeys.length > 0 ? cachedGalleries(galleryKeys) : [],
    pageIds.length > 0 ? cachedPageLinks(pageIds) : [],
  ]);
  return { galleries: new Map(galleries), links: new Map(links) };
}

export function loadContentContext(doc: RichTextDoc | null): Promise<ContentContext> {
  return loadContext(collectGalleryKeys(doc), []);
}

export function loadBlocksContext(blocks: readonly Block[]): Promise<ContentContext> {
  return loadContext(collectBlockGalleryKeys(blocks), collectBlockPageIds(blocks));
}
