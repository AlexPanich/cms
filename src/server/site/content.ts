import "server-only";
import type { ContentContext } from "@/components/site/rich-text";
import {
  type Block,
  collectBlockDocumentIds,
  collectBlockGalleryKeys,
  collectBlockMediaIds,
  collectBlockPageIds,
} from "@/lib/blocks/registry";
import { collectGalleryKeys, type RichTextDoc } from "@/lib/rich-text";
import {
  cachedDocuments,
  cachedGalleries,
  cachedImages,
  cachedLatestArticles,
  cachedPageLinks,
} from "./cached";

type Needs = {
  galleryKeys: string[];
  pageIds?: number[];
  imageIds?: number[];
  documentIds?: number[];
  articleCount?: number;
};

const sortIds = (ids: number[] = []) => ids.sort((a, b) => a - b);

// Загружает данные виджетов, ссылок и полей блоков заранее — одним (кешированным) запросом
// на тип данных. Ключи и id по порядку — чтобы один и тот же набор был одной записью в кеше.
async function loadContext(needs: Needs): Promise<ContentContext> {
  const galleryKeys = needs.galleryKeys.sort();
  const pageIds = sortIds(needs.pageIds);
  const imageIds = sortIds(needs.imageIds);
  const documentIds = sortIds(needs.documentIds);
  const [galleries, links, images, documents, articles] = await Promise.all([
    galleryKeys.length > 0 ? cachedGalleries(galleryKeys) : [],
    pageIds.length > 0 ? cachedPageLinks(pageIds) : [],
    imageIds.length > 0 ? cachedImages(imageIds) : [],
    documentIds.length > 0 ? cachedDocuments(documentIds) : [],
    needs.articleCount ? cachedLatestArticles(needs.articleCount) : [],
  ]);
  return {
    galleries: new Map(galleries),
    links: new Map(links),
    images: new Map(images),
    documents: new Map(documents),
    articles,
  };
}

export function loadContentContext(doc: RichTextDoc | null): Promise<ContentContext> {
  return loadContext({ galleryKeys: collectGalleryKeys(doc) });
}

export function loadBlocksContext(blocks: readonly Block[]): Promise<ContentContext> {
  // Блок «Последние статьи» берёт первые N из одного списка: загружаем самый длинный.
  const articleCount = Math.max(
    0,
    ...blocks.flatMap((block) => (block.type === "articles" ? [Number(block.data.count)] : [])),
  );
  return loadContext({
    galleryKeys: collectBlockGalleryKeys(blocks),
    pageIds: collectBlockPageIds(blocks),
    imageIds: collectBlockMediaIds(blocks),
    documentIds: collectBlockDocumentIds(blocks),
    articleCount,
  });
}
