import type { ComponentType } from "react";
import type { ImageValue, LinkValue } from "@/lib/blocks/define";
import type { Block, BlockType } from "@/lib/blocks/registry";
import { isSafeLinkUrl } from "@/lib/url";
import type { PublicDocument, PublicImage } from "@/server/site/service";
import type { ContentContext } from "./rich-text";

// Вывод блоков страницы. Как выглядит каждый блок, решает тема (BlockViews), а порядок,
// ключи и данные для ссылок и виджетов — ядро.

export type BlockProps<T extends BlockType = BlockType> = {
  block: Block<T>;
  pageId: number;
  context: ContentContext;
};

// Вид для каждого типа блока из реестра: без компонента тема не соберётся.
export type BlockViews = { [T in BlockType]: ComponentType<BlockProps<T>> };

export function Blocks({
  blocks,
  pageId,
  context,
  views,
}: {
  blocks: readonly Block[];
  pageId: number;
  context: ContentContext;
  views: BlockViews;
}) {
  return blocks.map((block) => {
    const View = views[block.type] as ComponentType<BlockProps>;
    return <View key={block.id} block={block} pageId={pageId} context={context} />;
  });
}

// Ссылка из поля блока: адрес и подпись. Ссылка на удалённую или снятую с публикации
// страницу не выводится (null). Пустая подпись — название страницы или адрес.
export function resolveLink(
  link: LinkValue | null,
  context: ContentContext,
): { href: string; label: string } | null {
  if (!link) return null;
  if (link.kind === "url") {
    return isSafeLinkUrl(link.url) ? { href: link.url, label: link.label || link.url } : null;
  }
  const page = context.links.get(link.pageId);
  return page ? { href: page.href, label: link.label || page.title } : null;
}

// Картинка из поля блока. Удалённая из медиатеки не выводится (null). Пустой alt —
// описание из медиатеки.
export function resolveImage(
  image: ImageValue | null,
  context: ContentContext,
): PublicImage | null {
  if (!image) return null;
  const stored = context.images.get(image.mediaId);
  return stored ? { ...stored, alt: image.alt || stored.alt } : null;
}

// Документ из поля блока. Удалённый не выводится (null). Пустое название — из раздела «Документы».
export function resolveDocument(
  id: number | null,
  title: string,
  context: ContentContext,
): PublicDocument | null {
  const stored = id === null ? undefined : context.documents.get(id);
  return stored ? { ...stored, title: title || stored.title } : null;
}
