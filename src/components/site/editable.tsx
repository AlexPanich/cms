import { cache, type ReactNode } from "react";
import { db } from "@/db";
import { type Field, type Fields, fieldReferences, walkFields } from "@/lib/blocks/define";
import { hasFieldKind } from "@/lib/blocks/form";
import { type Block, collectBlockMediaIds, getBlockDefinition } from "@/lib/blocks/registry";
import { SITE_TEXTS, type SiteTextKey } from "@/lib/site";
import { pickSettingsFields, type SiteSettingsKey } from "@/lib/site-settings";
import { listDocumentOptions } from "@/server/documents/service";
import { listGalleryOptions } from "@/server/galleries/service";
import { listImageUrls } from "@/server/media/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { cachedSiteSettings } from "@/server/site/cached";
import { getFrontEditor } from "@/server/site/front-editor";
import { BlockEditor, PageTitleEditor, SettingsEditor, TextEditor } from "./front-edit-lazy";

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
const documentOptions = cache(() => listDocumentOptions(db()));
// Ссылаться из блока на сайте можно только на опубликованные страницы.
const linkPageOptions = cache(async () =>
  flattenTree(await getPageTree(db(), { publishedOnly: true })).map(({ id, title, depth }) => ({
    id,
    title,
    depth,
  })),
);

// Списки для полей формы — только те, что нужны её полям, и адреса уже выбранных картинок.
async function fieldOptions(fields: Fields, imageIds: number[]) {
  const needs = (kind: Field["kind"]) => hasFieldKind(fields, kind);
  const [galleries, pages, documents, images] = await Promise.all([
    needs("richText") || needs("gallery") ? galleryOptions() : [],
    needs("link") ? linkPageOptions() : [],
    needs("document") ? documentOptions() : [],
    listImageUrls(db(), imageIds),
  ]);
  return { galleries, pages, documents, images };
}

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
  const options = await fieldOptions(definition.fields, collectBlockMediaIds([block]));
  return (
    <BlockEditor pageId={pageId} block={block} {...options}>
      {children}
    </BlockEditor>
  );
}

// Настройки сайта из списка fields (контакты в подвале, логотип): кнопка «Изменить»
// открывает их форму в диалоге. Остальные настройки не меняются. label — что правится,
// для подписи кнопки: «контакты».
export async function EditableSettings({
  fields,
  label,
  children,
}: {
  fields: readonly SiteSettingsKey[];
  label: string;
  children: ReactNode;
}) {
  if (!(await getFrontEditor())) return children;
  const settings = await cachedSiteSettings();
  const picked = pickSettingsFields(fields);
  const values = Object.fromEntries(fields.map((name) => [name, settings[name]]));
  const options = await fieldOptions(picked, fieldReferences(walkFields(picked, values)).imageIds);
  return (
    <SettingsEditor fields={[...fields]} label={label} values={values} {...options}>
      {children}
    </SettingsEditor>
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
