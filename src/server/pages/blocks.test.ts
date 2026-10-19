import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import type { Tx } from "@/db";
import { media, pageMedia, pages } from "@/db/schema";
import { listImages } from "@/server/media/service";
import { withRollback } from "@/test/db";
import { createPage, getPage, updatePage, updatePageBlock } from "./service";

// Блок с картинкой — в каталоге ядра таких пока нет, поэтому он объявлен темой.
vi.mock("@/theme/blocks", async () => {
  const { defineBlock, field } = await import("@/lib/blocks/define");
  return {
    THEME_BLOCKS: [
      defineBlock({
        type: "photo",
        label: "Фото",
        description: "",
        example: {},
        fields: {
          caption: field.text({ label: "Подпись" }),
          image: field.image({ label: "Картинка" }),
        },
      }),
    ],
    BLOCK_VARIANTS: {},
  };
});

async function insertImages(tx: Tx, count: number) {
  const rows = await tx
    .insert(media)
    .values(
      Array.from({ length: count }, (_, index) => ({
        kind: "image" as const,
        storageKey: `images/test/blocks-${index}.webp`,
        originalName: `blocks-${index}.webp`,
        mimeType: "image/webp",
        size: 1,
      })),
    )
    .returning({ id: media.id });
  return rows.map((row) => row.id);
}

const photo = (id: string, mediaId: number, caption = "") => ({
  id,
  type: "photo",
  data: { caption, image: { mediaId } },
});

async function usedMedia(tx: Tx, pageId: number) {
  const rows = await tx
    .select({ mediaId: pageMedia.mediaId })
    .from(pageMedia)
    .where(eq(pageMedia.pageId, pageId));
  return rows.map((row) => row.mediaId).sort((a, b) => a - b);
}

describe("блоки страницы", () => {
  it("пишет текст для поиска и картинки из блоков", () =>
    withRollback(async (tx) => {
      const [a, b, c] = await insertImages(tx, 3);
      const page = await createPage(tx, {
        parentId: null,
        slug: "blocks-media",
        title: "Блоки",
        blocks: [photo("p1", a, "Мастерская"), photo("p2", b, "Станок"), photo("p3", a)],
      });
      expect(page.searchText).toBe("Мастерская\nСтанок");
      expect(await usedMedia(tx, page.id)).toEqual([a, b]);

      const images = await listImages(tx, { page: 1, search: "blocks-", unused: true });
      expect(images.items.map((item) => item.id)).toEqual([c]);

      await updatePage(tx, page.id, {
        parentId: null,
        slug: "blocks-media",
        title: "Блоки",
        blocks: [photo("p1", c)],
      });
      expect(await usedMedia(tx, page.id)).toEqual([c]);

      await updatePageBlock(tx, page.id, "p1", { caption: "Цех", image: { mediaId: b } });
      expect(await usedMedia(tx, page.id)).toEqual([b]);
      expect((await getPage(tx, page.id))?.searchText).toBe("Цех");
    }));

  it("не учитывает удалённые картинки и документы", () =>
    withRollback(async (tx) => {
      const [image] = await insertImages(tx, 1);
      const [document] = await tx
        .insert(media)
        .values({
          kind: "document",
          storageKey: "documents/test/blocks.pdf",
          originalName: "a.pdf",
          mimeType: "application/pdf",
          size: 1,
        })
        .returning({ id: media.id });
      const page = await createPage(tx, {
        parentId: null,
        slug: "blocks-missing",
        title: "Блоки",
        blocks: [photo("p1", image), photo("p2", document.id), photo("p3", 2_000_000_000)],
      });
      expect(await usedMedia(tx, page.id)).toEqual([image]);
      expect((await getPage(tx, page.id))?.blocks).toHaveLength(3);
    }));

  it("правка блока не трогает блоки, которые не проходят схему", () =>
    withRollback(async (tx) => {
      const page = await createPage(tx, {
        parentId: null,
        slug: "blocks-stale",
        title: "Блоки",
        blocks: [photo("p1", 1)],
      });
      const stale = { id: "old", type: "slider", data: { speed: 3 } };
      await tx
        .update(pages)
        .set({ blocks: [stale, ...page.blocks] })
        .where(eq(pages.id, page.id));

      await updatePageBlock(tx, page.id, "p1", { caption: "Новая" });
      expect((await getPage(tx, page.id))?.blocks).toEqual([
        stale,
        { id: "p1", type: "photo", variant: null, data: { caption: "Новая", image: null } },
      ]);
    }));
});
