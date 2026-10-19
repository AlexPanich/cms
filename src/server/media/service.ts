import "server-only";
import { and, count, desc, eq, ilike, inArray, not, type SQL, sql } from "drizzle-orm";
import type { Executor, Tx } from "@/db";
import { media } from "@/db/schema";
import { MAX_IMAGE_BYTES, mediaUrl } from "@/lib/media";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { MediaError } from "./errors";
import { processImage } from "./image";
import { type ImageInfoInput, imageInfoSchema } from "./schema";
import { deleteStoredFile, newStorageKey, writeStoredFile } from "./storage";

export type Media = typeof media.$inferSelect;

// Файл из FormData: проверяем тип и размер до чтения содержимого.
export function assertUpload(value: unknown, maxBytes: number): asserts value is File {
  if (!(value instanceof File) || value.size === 0) {
    throw new MediaError("invalid_file", "Выберите файл", "file");
  }
  if (value.size > maxBytes) {
    throw new MediaError("invalid_file", `Файл больше ${maxBytes / 1024 / 1024} МБ`, "file");
  }
}

// Имя файла от пользователя только показываем — на диске оно не используется.
export function cleanName(name: string, fallback: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  return base.replace(/\p{Cc}/gu, "").slice(0, 255) || fallback;
}

export async function saveUploadedImage(
  executor: Executor,
  upload: unknown,
  uploadedBy: string | null,
): Promise<Media> {
  assertUpload(upload, MAX_IMAGE_BYTES);
  const image = await processImage(new Uint8Array(await upload.arrayBuffer()));
  const storageKey = newStorageKey("images", "webp");
  await writeStoredFile(storageKey, image.data);

  try {
    const [row] = await executor
      .insert(media)
      .values({
        kind: "image",
        storageKey,
        originalName: cleanName(upload.name, "image"),
        mimeType: "image/webp",
        size: image.data.length,
        width: image.width,
        height: image.height,
        uploadedBy,
      })
      .returning();
    return row;
  } catch (error) {
    await deleteStoredFile(storageKey);
    throw error;
  }
}

export async function getMedia(executor: Executor, id: number): Promise<Media | null> {
  const [row] = await executor.select().from(media).where(eq(media.id, id));
  return row ?? null;
}

// Адреса картинок по id — для превью в формах. Удалённых и документов в ответе нет.
export async function listImageUrls(
  executor: Executor,
  ids: readonly number[],
): Promise<Record<number, string>> {
  if (ids.length === 0) return {};
  const rows = await executor
    .select({ id: media.id, storageKey: media.storageKey })
    .from(media)
    .where(and(inArray(media.id, [...ids]), eq(media.kind, "image")));
  return Object.fromEntries(rows.map((row) => [row.id, mediaUrl(row.storageKey)]));
}

// Для ссылок на картинку из других модулей: блокирует строку на чтение, чтобы её
// не удалили до конца транзакции. field — поле формы для сообщения об ошибке.
export async function assertImageExists(tx: Tx, id: number, field: string): Promise<void> {
  const [row] = await tx
    .select({ id: media.id })
    .from(media)
    .where(and(eq(media.id, id), eq(media.kind, "image")))
    .for("share");
  if (!row) throw new MediaError("media_not_found", "Изображение не найдено", field);
}

const imageNotFound = () => new MediaError("media_not_found", "Изображение не найдено");

// Сколько раз картинка используется: в галереях, как превью статей, в блоках страниц
// и в настройках сайта (логотип).
// Новые ссылки на media из других модулей нужно добавить сюда.
// Имена таблиц написаны явно: в запросе к одной таблице Drizzle пишет колонки без
// таблицы, и в подзапросе "id" связался бы не с media, а с таблицей подзапроса.
const galleryUses = sql<number>`(
  select count(*) from gallery_items where gallery_items.media_id = media.id
)`.mapWith(Number);
const articleUses = sql<number>`(
  select count(*) from articles where articles.preview_id = media.id
)`.mapWith(Number);
const pageUses = sql<number>`(
  select count(*) from page_media where page_media.media_id = media.id
)`.mapWith(Number);
const settingsUses = sql<number>`(
  select count(*) from settings_media where settings_media.media_id = media.id
)`.mapWith(Number);
const isUsed = sql`(${galleryUses} + ${articleUses} + ${pageUses} + ${settingsUses}) > 0`;

// Файлы удаляем после фиксации транзакции: если она откатится, записи вернутся,
// а файлы должны остаться на месте. Ошибка удаления файла не отменяет удаление записи.
export async function deleteStoredFiles(keys: readonly string[]): Promise<void> {
  const results = await Promise.allSettled(keys.map((key) => deleteStoredFile(key)));
  for (const result of results) {
    if (result.status === "rejected") console.error("Не удалось удалить файл", result.reason);
  }
}

// Удаляет из ids картинки, на которые больше ничего не ссылается. Возвращает ключи их
// файлов — их удаляет вызывающий через deleteStoredFiles после своей транзакции.
export async function deleteUnusedImages(tx: Tx, ids: readonly number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const deleted = await tx
    .delete(media)
    .where(and(inArray(media.id, [...ids]), eq(media.kind, "image"), not(isUsed)))
    .returning({ storageKey: media.storageKey });
  return deleted.map((row) => row.storageKey);
}

// Удаление из медиатеки: картинка пропадёт из галерей, блоков страниц и настроек сайта,
// а у статей уберётся превью.
export async function deleteImage(executor: Executor, id: number): Promise<void> {
  const [deleted] = await executor
    .delete(media)
    .where(and(eq(media.id, id), eq(media.kind, "image")))
    .returning({ storageKey: media.storageKey });
  if (!deleted) throw imageNotFound();
  await deleteStoredFiles([deleted.storageKey]);
}

export async function updateImageInfo(
  executor: Executor,
  id: number,
  input: ImageInfoInput,
): Promise<Media> {
  const data = imageInfoSchema.parse(input);
  const [row] = await executor
    .update(media)
    .set(data)
    .where(and(eq(media.id, id), eq(media.kind, "image")))
    .returning();
  if (!row) throw imageNotFound();
  return row;
}

export async function listImages(
  executor: Executor,
  { page, search, unused }: { page: number; search: string; unused: boolean },
) {
  const conditions: SQL[] = [eq(media.kind, "image")];
  if (search) conditions.push(ilike(media.originalName, likePattern(search)));
  if (unused) conditions.push(not(isUsed));
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({
        id: media.id,
        storageKey: media.storageKey,
        originalName: media.originalName,
        alt: media.alt,
        size: media.size,
        width: media.width,
        height: media.height,
        createdAt: media.createdAt,
        galleryUses,
        articleUses,
        pageUses,
        settingsUses,
      })
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt), desc(media.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(media).where(where),
  ]);
  return {
    items: rows.map(({ storageKey, ...row }) => ({ ...row, url: mediaUrl(storageKey) })),
    total,
  };
}

export type ImageListItem = Awaited<ReturnType<typeof listImages>>["items"][number];
