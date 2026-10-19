import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Executor, Tx } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { galleries, galleryItems, media } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { DomainError } from "@/server/errors";
import { deleteStoredFiles, deleteUnusedImages, saveUploadedImage } from "@/server/media/service";
import { type GalleryInput, galleryInputSchema } from "./schema";

export type Gallery = typeof galleries.$inferSelect;

export type GalleryErrorCode =
  "gallery_not_found" | "image_not_found" | "key_taken" | "invalid_order";

export class GalleryError extends DomainError<GalleryErrorCode> {}

const notFound = () => new GalleryError("gallery_not_found", "Галерея не найдена");

function toGalleryError(error: unknown): unknown {
  return isUniqueViolation(error, "galleries_key_unique")
    ? new GalleryError("key_taken", "Галерея с таким ключом уже существует", "key")
    : error;
}

// Блокировка галереи упорядочивает параллельные загрузки, сортировку и удаление.
async function lockGallery(tx: Tx, galleryId: number): Promise<Gallery> {
  const [gallery] = await tx
    .select()
    .from(galleries)
    .where(eq(galleries.id, galleryId))
    .for("update");
  if (!gallery) throw notFound();
  return gallery;
}

export async function createGallery(executor: Executor, input: GalleryInput): Promise<Gallery> {
  const data = galleryInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    try {
      const [gallery] = await tx.insert(galleries).values(data).returning();
      return gallery;
    } catch (error) {
      throw toGalleryError(error);
    }
  });
}

export async function updateGallery(
  executor: Executor,
  id: number,
  input: GalleryInput,
): Promise<Gallery> {
  const data = galleryInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    try {
      const [gallery] = await tx
        .update(galleries)
        .set(data)
        .where(eq(galleries.id, id))
        .returning();
      if (!gallery) throw notFound();
      return gallery;
    } catch (error) {
      throw toGalleryError(error);
    }
  });
}

// Вместе с галереей удаляются её картинки, которые больше нигде не используются.
export async function deleteGallery(executor: Executor, id: number): Promise<void> {
  const keys = await executor.transaction(async (tx) => {
    await lockGallery(tx, id);
    const items = await tx
      .delete(galleryItems)
      .where(eq(galleryItems.galleryId, id))
      .returning({ mediaId: galleryItems.mediaId });
    await tx.delete(galleries).where(eq(galleries.id, id));
    return deleteUnusedImages(
      tx,
      items.map((item) => item.mediaId),
    );
  });
  await deleteStoredFiles(keys);
}

// Загружает картинку и ставит её в конец галереи. Галерея заблокирована на время обработки
// картинки, поэтому загрузки в одну галерею идут по очереди — клиент так и отправляет.
export async function uploadGalleryImage(
  executor: Executor,
  galleryId: number,
  upload: unknown,
  uploadedBy: string | null,
) {
  let storageKey: string | null = null;
  try {
    return await executor.transaction(async (tx) => {
      await lockGallery(tx, galleryId);
      const image = await saveUploadedImage(tx, upload, uploadedBy);
      storageKey = image.storageKey;
      const [{ value: sort }] = await tx
        .select({ value: sql`coalesce(max(${galleryItems.sort}) + 1, 0)`.mapWith(Number) })
        .from(galleryItems)
        .where(eq(galleryItems.galleryId, galleryId));
      await tx.insert(galleryItems).values({ galleryId, mediaId: image.id, sort });
      return image;
    });
  } catch (error) {
    // Транзакция откатилась, а файл уже записан.
    if (storageKey) await deleteStoredFiles([storageKey]);
    throw error;
  }
}

// Убирает картинку из галереи. Если она больше нигде не используется — удаляет совсем.
export async function removeGalleryImage(
  executor: Executor,
  galleryId: number,
  mediaId: number,
): Promise<void> {
  const keys = await executor.transaction(async (tx) => {
    await lockGallery(tx, galleryId);
    const removed = await tx
      .delete(galleryItems)
      .where(and(eq(galleryItems.galleryId, galleryId), eq(galleryItems.mediaId, mediaId)))
      .returning({ mediaId: galleryItems.mediaId });
    if (removed.length === 0) {
      throw new GalleryError("image_not_found", "Изображения нет в галерее");
    }
    return deleteUnusedImages(tx, [mediaId]);
  });
  await deleteStoredFiles(keys);
}

// orderedMediaIds — полный список картинок галереи в новом порядке.
export async function reorderGalleryImages(
  executor: Executor,
  galleryId: number,
  orderedMediaIds: readonly number[],
): Promise<void> {
  await executor.transaction(async (tx) => {
    await lockGallery(tx, galleryId);
    const items = await tx
      .select({ mediaId: galleryItems.mediaId })
      .from(galleryItems)
      .where(eq(galleryItems.galleryId, galleryId));

    const expected = new Set(items.map((item) => item.mediaId));
    const isPermutation =
      orderedMediaIds.length === expected.size &&
      new Set(orderedMediaIds).size === orderedMediaIds.length &&
      orderedMediaIds.every((id) => expected.has(id));
    if (!isPermutation) {
      throw new GalleryError("invalid_order", "Список изображений устарел, обновите страницу");
    }

    for (const [index, mediaId] of orderedMediaIds.entries()) {
      await tx
        .update(galleryItems)
        .set({ sort: index })
        .where(and(eq(galleryItems.galleryId, galleryId), eq(galleryItems.mediaId, mediaId)));
    }
  });
}

export async function getGallery(executor: Executor, id: number): Promise<Gallery | null> {
  const [gallery] = await executor.select().from(galleries).where(eq(galleries.id, id));
  return gallery ?? null;
}

export async function getGalleryImages(executor: Executor, galleryId: number) {
  const rows = await executor
    .select({
      id: media.id,
      storageKey: media.storageKey,
      originalName: media.originalName,
      alt: media.alt,
      width: media.width,
      height: media.height,
    })
    .from(galleryItems)
    .innerJoin(media, eq(media.id, galleryItems.mediaId))
    .where(eq(galleryItems.galleryId, galleryId))
    .orderBy(asc(galleryItems.sort), asc(galleryItems.mediaId));
  return rows.map(({ storageKey, ...row }) => ({ ...row, url: mediaUrl(storageKey) }));
}

export type GalleryImage = Awaited<ReturnType<typeof getGalleryImages>>[number];

export async function listGalleries(
  executor: Executor,
  { page, search }: { page: number; search: string },
) {
  const where = search
    ? or(ilike(galleries.title, likePattern(search)), ilike(galleries.key, likePattern(search)))
    : undefined;

  // Обложка в списке — первая картинка галереи. Имена таблиц написаны явно,
  // как в подзапросах media/service.ts.
  const cover = sql<string | null>`(
    select media.storage_key from gallery_items
    inner join media on media.id = gallery_items.media_id
    where gallery_items.gallery_id = galleries.id
    order by gallery_items.sort, gallery_items.media_id
    limit 1
  )`;
  const imageCount = sql<number>`(
    select count(*) from gallery_items where gallery_items.gallery_id = galleries.id
  )`.mapWith(Number);

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({
        id: galleries.id,
        key: galleries.key,
        title: galleries.title,
        cover,
        imageCount,
      })
      .from(galleries)
      .where(where)
      .orderBy(desc(galleries.createdAt), desc(galleries.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(galleries).where(where),
  ]);
  return {
    items: rows.map(({ cover, ...row }) => ({
      ...row,
      coverUrl: cover ? mediaUrl(cover) : null,
    })),
    total,
  };
}
