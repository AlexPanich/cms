import { access } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { env } from "@/env";
import type { Tx } from "@/db";
import { articles, galleries, galleryItems, media } from "@/db/schema";
import { MediaError } from "@/server/media/errors";
import { deleteStoredFiles } from "@/server/media/service";
import { withRollback as withRollbackBase } from "@/test/db";
import {
  createGallery,
  deleteGallery,
  GalleryError,
  type GalleryErrorCode,
  getGalleryImages,
  listGalleries,
  removeGalleryImage,
  reorderGalleryImages,
  updateGallery,
  uploadGalleryImage,
} from "./service";

// Тесты сравнивают списки, поэтому начинают с пустой таблицы галерей.
const withRollback = (fn: (tx: Tx) => Promise<void>) =>
  withRollbackBase(fn, { clear: [galleries] });

// Записи в БД откатываются, а файлы, которые тест не удалил сам, удаляем после него.
const storedKeys: string[] = [];
afterEach(async () => {
  await deleteStoredFiles(storedKeys.splice(0));
});

const png = async (name = "photo.png") =>
  new File(
    [
      new Uint8Array(
        await sharp({ create: { width: 20, height: 10, channels: 3, background: "#0a0" } })
          .png()
          .toBuffer(),
      ),
    ],
    name,
  );

async function upload(tx: Tx, galleryId: number, name?: string) {
  const image = await uploadGalleryImage(tx, galleryId, await png(name), null);
  storedKeys.push(image.storageKey);
  return image;
}

const fileExists = (storageKey: string) =>
  access(path.join(env().STORAGE_DIR, storageKey)).then(
    () => true,
    () => false,
  );

async function expectGalleryError(promise: Promise<unknown>, code: GalleryErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof GalleryError && error.code === code,
  );
}

describe("galleries service", () => {
  it("создаёт и правит галерею, не даёт занять чужой ключ", () =>
    withRollback(async (tx) => {
      const gallery = await createGallery(tx, { key: "office", title: "  Офис " });
      expect(gallery).toMatchObject({ key: "office", title: "Офис" });
      const other = await createGallery(tx, { key: "team", title: "Команда" });

      await expectGalleryError(createGallery(tx, { key: "office", title: "x" }), "key_taken");
      await expectGalleryError(
        updateGallery(tx, other.id, { key: "office", title: "x" }),
        "key_taken",
      );
      await expect(createGallery(tx, { key: "Bad Key", title: "x" })).rejects.toThrow();

      await deleteGallery(tx, other.id);
      await expectGalleryError(
        updateGallery(tx, other.id, { key: "team", title: "x" }),
        "gallery_not_found",
      );
      // Ошибка запроса прерывает транзакцию, поэтому эта проверка последняя.
      await expect(tx.insert(galleries).values({ key: "Bad Key", title: "x" })).rejects.toThrow();
    }));

  it("загружает картинки в конец галереи и меняет их порядок", () =>
    withRollback(async (tx) => {
      const gallery = await createGallery(tx, { key: "office", title: "Офис" });
      const [a, b, c] = [
        await upload(tx, gallery.id, "a.png"),
        await upload(tx, gallery.id, "b.png"),
        await upload(tx, gallery.id, "c.png"),
      ];
      const names = async () =>
        (await getGalleryImages(tx, gallery.id)).map((image) => image.originalName);
      expect(await names()).toEqual(["a.png", "b.png", "c.png"]);

      await reorderGalleryImages(tx, gallery.id, [c.id, a.id, b.id]);
      expect(await names()).toEqual(["c.png", "a.png", "b.png"]);

      // Порядок принимается только полной перестановкой.
      for (const order of [
        [c.id, a.id],
        [c.id, a.id, a.id],
        [c.id, a.id, b.id, 999_999],
      ]) {
        await expectGalleryError(reorderGalleryImages(tx, gallery.id, order), "invalid_order");
      }

      const [listed] = (await listGalleries(tx, { page: 1, search: "" })).items;
      expect(listed).toMatchObject({ imageCount: 3, coverUrl: `/media/${c.storageKey}` });
    }));

  it("не загружает в несуществующую галерею и не оставляет файлов при ошибке", () =>
    withRollback(async (tx) => {
      await expectGalleryError(
        uploadGalleryImage(tx, 999_999, await png(), null),
        "gallery_not_found",
      );
      const gallery = await createGallery(tx, { key: "office", title: "Офис" });
      await expect(
        uploadGalleryImage(tx, gallery.id, new File(["<?php ?>"], "x.png"), null),
      ).rejects.toBeInstanceOf(MediaError);
      expect(await getGalleryImages(tx, gallery.id)).toEqual([]);
    }));

  it("удаляет картинку вместе с файлом, если она больше нигде не используется", () =>
    withRollback(async (tx) => {
      const gallery = await createGallery(tx, { key: "office", title: "Офис" });
      const other = await createGallery(tx, { key: "team", title: "Команда" });
      const single = await upload(tx, gallery.id);
      const shared = await upload(tx, gallery.id);
      await tx.insert(articles).values({ slug: "news", title: "Новость", previewId: shared.id });

      await removeGalleryImage(tx, gallery.id, single.id);
      await removeGalleryImage(tx, gallery.id, shared.id);
      expect(await getGalleryImages(tx, gallery.id)).toEqual([]);
      expect(await fileExists(single.storageKey)).toBe(false);
      expect(await tx.select().from(media).where(eq(media.id, single.id))).toEqual([]);
      // Превью статьи остаётся.
      expect(await fileExists(shared.storageKey)).toBe(true);
      expect(await tx.select().from(media).where(eq(media.id, shared.id))).toHaveLength(1);

      await expectGalleryError(removeGalleryImage(tx, gallery.id, single.id), "image_not_found");
      await expectGalleryError(removeGalleryImage(tx, other.id, shared.id), "image_not_found");
    }));

  it("при удалении галереи удаляет её неиспользуемые картинки", () =>
    withRollback(async (tx) => {
      const gallery = await createGallery(tx, { key: "office", title: "Офис" });
      const own = await upload(tx, gallery.id);
      const shared = await upload(tx, gallery.id);
      const other = await createGallery(tx, { key: "team", title: "Команда" });
      await tx.insert(galleryItems).values({ galleryId: other.id, mediaId: shared.id });

      await deleteGallery(tx, gallery.id);
      expect(await fileExists(own.storageKey)).toBe(false);
      expect(await fileExists(shared.storageKey)).toBe(true);
      expect((await getGalleryImages(tx, other.id)).map((image) => image.id)).toEqual([shared.id]);
      await expectGalleryError(deleteGallery(tx, gallery.id), "gallery_not_found");
    }));

  it("ищет по названию и ключу", () =>
    withRollback(async (tx) => {
      await createGallery(tx, { key: "office", title: "Офис" });
      await createGallery(tx, { key: "team", title: "Команда 100%" });
      const keys = async (search: string) =>
        (await listGalleries(tx, { page: 1, search })).items.map((item) => item.key);
      expect(await keys("офи")).toEqual(["office"]);
      expect(await keys("tea")).toEqual(["team"]);
      expect(await keys("%")).toEqual(["team"]);
      expect((await listGalleries(tx, { page: 1, search: "" })).total).toBe(2);
    }));
});
