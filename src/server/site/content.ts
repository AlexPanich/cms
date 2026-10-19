import "server-only";
import type { ContentContext } from "@/components/site/rich-text";
import type { FieldReferences } from "@/lib/blocks/define";
import { type Block, blockReferences } from "@/lib/blocks/registry";
import { collectGalleryKeys, type RichTextDoc } from "@/lib/rich-text";
import { settingsReferences } from "@/server/settings/service";
import {
  cachedDocuments,
  cachedGalleries,
  cachedImages,
  cachedLatestArticles,
  cachedPageLinks,
  cachedSiteSettings,
} from "./cached";

type Needs = Partial<FieldReferences> & { articleCount?: number };

// Ключи и id без повторов и по порядку — чтобы один и тот же набор был одной записью в кеше.
const sortIds = (...lists: (number[] | undefined)[]) =>
  [...new Set(lists.flatMap((ids) => ids ?? []))].sort((a, b) => a - b);
const sortKeys = (...lists: (string[] | undefined)[]) =>
  [...new Set(lists.flatMap((keys) => keys ?? []))].sort();

// Загружает данные виджетов, ссылок и полей блоков заранее — одним (кешированным) запросом
// на тип данных. Настройки сайта есть в каждом контексте, вместе с данными их полей
// (логотип): их выводят шапка, подвал и блок «Контакты».
async function loadContext(needs: Needs): Promise<ContentContext> {
  const settings = await cachedSiteSettings();
  const own = settingsReferences(settings);
  const galleryKeys = sortKeys(needs.galleryKeys, own.galleryKeys);
  const pageIds = sortIds(needs.pageIds, own.pageIds);
  const imageIds = sortIds(needs.imageIds, own.imageIds);
  const documentIds = sortIds(needs.documentIds, own.documentIds);
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
    settings,
  };
}

// Контекст лейаута сайта: только настройки и данные их полей.
export function loadSiteContext(): Promise<ContentContext> {
  return loadContext({});
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
  return loadContext({ ...blockReferences(blocks), articleCount });
}
