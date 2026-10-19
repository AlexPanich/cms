import type { ReactNode } from "react";
import { db } from "@/db";
import type { RichTextDoc } from "@/lib/rich-text";
import { SITE_TEXTS, type SiteTextKey } from "@/lib/site";
import { listGalleryOptions } from "@/server/galleries/service";
import { getFrontEditor } from "@/server/site/front-editor";
import { PageContentEditor, PageTitleEditor, TextEditor } from "./front-edit-lazy";

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

export async function EditablePageContent({
  pageId,
  value,
  children,
}: {
  pageId: number;
  value: RichTextDoc | null;
  children: ReactNode;
}) {
  if (!(await getFrontEditor())) return children;
  // Список галерей для вставки в текст — только редактору и без кеша.
  const galleries = await listGalleryOptions(db());
  return (
    <PageContentEditor pageId={pageId} value={value} galleries={galleries}>
      {children}
    </PageContentEditor>
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
