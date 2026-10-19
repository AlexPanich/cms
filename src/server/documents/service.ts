import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Executor } from "@/db";
import { media } from "@/db/schema";
import { documentExtension, MAX_DOCUMENT_BYTES, mediaUrl } from "@/lib/media";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { MediaError } from "@/server/media/errors";
import { assertUpload, cleanName, deleteStoredFiles, type Media } from "@/server/media/service";
import { newStorageKey, writeStoredFile } from "@/server/media/storage";
import { DOCUMENT_TYPES } from "./detect";
import { type DocumentInput, documentInputSchema } from "./schema";

const notFound = () => new MediaError("media_not_found", "Документ не найден");

const isDocument = (id: number) => and(eq(media.id, id), eq(media.kind, "document"));

// Документ сохраняется как есть, но только из белого списка расширений и если
// содержимое совпадает с форматом. Имя на диске — случайное, расширение — из списка,
// MIME — из списка, а не от браузера. Отдаётся всегда как вложение.
export async function saveUploadedDocument(
  executor: Executor,
  upload: unknown,
  input: DocumentInput,
  uploadedBy: string | null,
): Promise<Media> {
  const data = documentInputSchema.parse(input);
  assertUpload(upload, MAX_DOCUMENT_BYTES);
  const originalName = cleanName(upload.name, "document");
  const extension = documentExtension(originalName);
  if (!extension) {
    throw new MediaError(
      "unsupported_document",
      "Такой тип файла не поддерживается. Подходят PDF, документы Word, Excel, PowerPoint и OpenDocument, RTF, TXT, CSV и ZIP",
      "file",
    );
  }
  const type = DOCUMENT_TYPES[extension];
  const content = new Uint8Array(await upload.arrayBuffer());
  if (!type.matches(content)) {
    throw new MediaError(
      "unsupported_document",
      `Содержимое файла не похоже на .${extension}`,
      "file",
    );
  }

  const storageKey = newStorageKey("documents", extension);
  await writeStoredFile(storageKey, content);
  try {
    const [row] = await executor
      .insert(media)
      .values({
        kind: "document",
        storageKey,
        originalName,
        mimeType: type.mimeType,
        size: content.length,
        title: data.title,
        uploadedBy,
      })
      .returning();
    return row;
  } catch (error) {
    await deleteStoredFiles([storageKey]);
    throw error;
  }
}

export async function updateDocument(
  executor: Executor,
  id: number,
  input: DocumentInput,
): Promise<Media> {
  const data = documentInputSchema.parse(input);
  const [row] = await executor.update(media).set(data).where(isDocument(id)).returning();
  if (!row) throw notFound();
  return row;
}

export async function deleteDocument(executor: Executor, id: number): Promise<void> {
  const [deleted] = await executor
    .delete(media)
    .where(isDocument(id))
    .returning({ storageKey: media.storageKey });
  if (!deleted) throw notFound();
  await deleteStoredFiles([deleted.storageKey]);
}

export async function getDocument(executor: Executor, id: number) {
  const [row] = await executor.select().from(media).where(isDocument(id));
  return row ? { ...row, url: mediaUrl(row.storageKey) } : null;
}

// Для обработчика /media: имя файла для скачивания и MIME из записи.
export async function getDocumentByStorageKey(executor: Executor, storageKey: string) {
  const [row] = await executor
    .select({ originalName: media.originalName, mimeType: media.mimeType })
    .from(media)
    .where(and(eq(media.storageKey, storageKey), eq(media.kind, "document")));
  return row ?? null;
}

export async function listDocuments(
  executor: Executor,
  { page, search }: { page: number; search: string },
) {
  const where = and(
    eq(media.kind, "document"),
    search
      ? or(ilike(media.title, likePattern(search)), ilike(media.originalName, likePattern(search)))
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({
        id: media.id,
        title: media.title,
        originalName: media.originalName,
        storageKey: media.storageKey,
        size: media.size,
        createdAt: media.createdAt,
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

// Документы для выбора в блоке «Документы»: название или имя файла.
export async function listDocumentOptions(executor: Executor) {
  const title = sql<string>`coalesce(nullif(${media.title}, ''), ${media.originalName})`;
  return executor
    .select({ id: media.id, title })
    .from(media)
    .where(eq(media.kind, "document"))
    .orderBy(asc(title), asc(media.id));
}
