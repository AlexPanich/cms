import type { ReactNode } from "react";
import { db } from "@/db";
import type { Block } from "@/lib/blocks/registry";
import { SITE_TEXTS, type SiteTextKey } from "@/lib/site";
import { listGalleryOptions } from "@/server/galleries/service";
import { getFrontEditor } from "@/server/site/front-editor";
import { PageTitleEditor, TextBlockEditor, TextEditor } from "./front-edit-lazy";

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

export async function EditableTextBlock({
  pageId,
  block,
  children,
}: {
  pageId: number;
  block: Block<"text">;
  children: ReactNode;
}) {
  if (!(await getFrontEditor())) return children;
  // Список галерей для вставки в текст — только редактору и без кеша.
  const galleries = await listGalleryOptions(db());
  return (
    <TextBlockEditor pageId={pageId} blockId={block.id} value={block.data} galleries={galleries}>
      {children}
    </TextBlockEditor>
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
