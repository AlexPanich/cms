import "server-only";
import { and, eq } from "drizzle-orm";
import type { Executor, Tx } from "@/db";
import { media } from "@/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/media";
import { MediaError } from "./errors";
import { processImage } from "./image";
import { deleteStoredFile, newStorageKey, writeStoredFile } from "./storage";

export type Media = typeof media.$inferSelect;

// Файл из FormData: проверяем тип и размер до чтения содержимого.
function assertUpload(value: unknown): asserts value is File {
  if (!(value instanceof File) || value.size === 0) {
    throw new MediaError("invalid_file", "Выберите файл", "file");
  }
  if (value.size > MAX_IMAGE_BYTES) {
    throw new MediaError("invalid_file", "Файл больше 10 МБ", "file");
  }
}

// Имя файла от пользователя только показываем в админке — на диске оно не используется.
function cleanName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  return base.replace(/\p{Cc}/gu, "").slice(0, 255) || "image";
}

export async function saveUploadedImage(
  executor: Executor,
  upload: unknown,
  uploadedBy: string | null,
): Promise<Media> {
  assertUpload(upload);
  const image = await processImage(new Uint8Array(await upload.arrayBuffer()));
  const storageKey = newStorageKey("images", "webp");
  await writeStoredFile(storageKey, image.data);

  try {
    const [row] = await executor
      .insert(media)
      .values({
        kind: "image",
        storageKey,
        originalName: cleanName(upload.name),
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
