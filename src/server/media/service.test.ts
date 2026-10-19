import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { env } from "@/env";
import { MAX_IMAGE_BYTES } from "@/lib/media";
import { withRollback } from "@/test/db";
import { eq } from "drizzle-orm";
import { articles, media } from "@/db/schema";
import { MediaError } from "./errors";
import {
  deleteImage,
  deleteStoredFiles,
  listImages,
  saveUploadedImage,
  updateImageInfo,
} from "./service";
import { deleteStoredFile } from "./storage";

const png = () =>
  sharp({ create: { width: 20, height: 10, channels: 3, background: "#ff0000" } })
    .png()
    .toBuffer();

async function expectInvalidFile(upload: unknown) {
  await expect(
    withRollback((tx) => saveUploadedImage(tx, upload, null).then(() => undefined)),
  ).rejects.toSatisfy((error) => error instanceof MediaError && error.code === "invalid_file");
}

describe("saveUploadedImage", () => {
  it("сохраняет WebP в хранилище и запись в media", () =>
    withRollback(async (tx) => {
      const upload = new File([new Uint8Array(await png())], "../../photo\u0000.png");
      const row = await saveUploadedImage(tx, upload, null);
      try {
        expect(row).toMatchObject({
          kind: "image",
          mimeType: "image/webp",
          originalName: "photo.png",
          width: 20,
          height: 10,
        });
        expect(row.storageKey).toMatch(/^images\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
        const stored = await readFile(path.join(env().STORAGE_DIR, row.storageKey));
        expect(stored.length).toBe(row.size);
      } finally {
        // Запись в БД откатится, а файл нужно удалить самим.
        await deleteStoredFile(row.storageKey);
      }
    }));

  it("отклоняет пустой, слишком большой файл и не-файл", async () => {
    await expectInvalidFile(null);
    await expectInvalidFile("строка");
    await expectInvalidFile(new File([], "empty.png"));
    await expectInvalidFile(new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "big.png"));
  });
});

describe("медиатека", () => {
  it("показывает, где используется картинка, удаляет её вместе с файлом", () =>
    withRollback(async (tx) => {
      await tx.delete(media);
      const used = await saveUploadedImage(
        tx,
        new File([new Uint8Array(await png())], "used.png"),
        null,
      );
      const unused = await saveUploadedImage(
        tx,
        new File([new Uint8Array(await png())], "spare.png"),
        null,
      );
      try {
        const [article] = await tx
          .insert(articles)
          .values({ slug: "news", title: "Новость", previewId: used.id })
          .returning();

        const list = (options: { search?: string; unused?: boolean }) =>
          listImages(tx, { page: 1, search: "", unused: false, ...options });
        expect((await list({})).items).toMatchObject([
          { id: unused.id, articleUses: 0, galleryUses: 0 },
          { id: used.id, articleUses: 1, galleryUses: 0, url: `/media/${used.storageKey}` },
        ]);
        expect((await list({ unused: true })).items.map((item) => item.id)).toEqual([unused.id]);
        expect((await list({ search: "USED.p" })).items.map((item) => item.id)).toEqual([used.id]);

        // Можно удалить и используемую: у статьи пропадёт превью.
        await deleteImage(tx, used.id);
        await expect(readFile(path.join(env().STORAGE_DIR, used.storageKey))).rejects.toThrow();
        const [after] = await tx.select().from(articles).where(eq(articles.id, article.id));
        expect(after.previewId).toBeNull();
        await expect(deleteImage(tx, used.id)).rejects.toSatisfy(
          (error) => error instanceof MediaError && error.code === "media_not_found",
        );
      } finally {
        await deleteStoredFiles([used.storageKey, unused.storageKey]);
      }
    }));

  it("сохраняет описание картинки", () =>
    withRollback(async (tx) => {
      const image = await saveUploadedImage(
        tx,
        new File([new Uint8Array(await png())], "a.png"),
        null,
      );
      try {
        expect(await updateImageInfo(tx, image.id, { alt: "  Красный квадрат " })).toMatchObject({
          alt: "Красный квадрат",
        });
        expect(await updateImageInfo(tx, image.id, { alt: "" })).toMatchObject({ alt: null });
      } finally {
        await deleteStoredFiles([image.storageKey]);
      }
    }));
});
