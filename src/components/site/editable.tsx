import { cache, type ReactNode } from "react";
import { db } from "@/db";
import { hasFieldKind } from "@/lib/blocks/form";
import { type Block, collectBlockMediaIds, getBlockDefinition } from "@/lib/blocks/registry";
import { SITE_TEXTS, type SiteTextKey } from "@/lib/site";
import { listGalleryOptions } from "@/server/galleries/service";
import { listImageUrls } from "@/server/media/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { getFrontEditor } from "@/server/site/front-editor";
import { BlockEditor, PageTitleEditor, TextEditor } from "./front-edit-lazy";

// Обёртки для правки на сайте: пользователю с правом edit_from_front выводят клиентский
// редактор, всем остальным — только содержимое. Править можно лишь поля из белого списка
// (src/server/front-edit/schema.ts). Тема оборачивает ими соответствующие места разметки.

export async function EditablePageTitle({
  pageId,
  value,
  children,
}: {
  pageId: number;
  value: string;
  children: ReactNode;
}) {
  if (!(await getFrontEditor())) return children;
  return (
    <PageTitleEditor pageId={pageId} value={value}>
      {children}
    </PageTitleEditor>
  );
}

// Данные для формы блока — только редактору и без кеша сайта; на странице много блоков,
// поэтому списки загружаются один раз за запрос.
const galleryOptions = cache(() => listGalleryOptions(db()));
// Ссылаться из блока на сайте можно только на опубликованные страницы.
const linkPageOptions = cache(async () =>
  flattenTree(await getPageTree(db(), { publishedOnly: true })).map(({ id, title, depth }) => ({
    id,
    title,
    depth,
  })),
);

// Блок страницы: в режиме правки у него кнопка «Изменить», она открывает форму блока
// в диалоге. Сохраняются только данные блока (page.block), тип и оформление — в админке.
export async function EditableBlock({
  pageId,
  block,
  children,
}: {
  pageId: number;
  block: Block;
  children: ReactNode;
}) {
  const definition = getBlockDefinition(block.type);
  if (!definition || !(await getFrontEditor())) return children;
  const [galleries, pages, images] = await Promise.all([
    hasFieldKind(definition.fields, "richText") ? galleryOptions() : [],
    hasFieldKind(definition.fields, "link") ? linkPageOptions() : [],
    listImageUrls(db(), collectBlockMediaIds([block])),
  ]);
  return (
    <BlockEditor pageId={pageId} block={block} galleries={galleries} pages={pages} images={images}>
      {children}
    </BlockEditor>
  );
}

export async function EditableText({
  textKey,
  value,
  multiline,
  children,
}: {
  textKey: SiteTextKey;
  value: string;
  multiline?: boolean;
  children: ReactNode;
}) {
  if (!(await getFrontEditor())) return children;
  const label = SITE_TEXTS.find((text) => text.key === textKey)?.title ?? textKey;
  return (
    <TextEditor textKey={textKey} label={label} value={value} multiline={multiline}>
      {children}
    </TextEditor>
  );
}
