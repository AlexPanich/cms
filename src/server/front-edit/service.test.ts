import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { pages, texts } from "@/db/schema";
import type { Tx } from "@/db";
import { z } from "@/lib/zod";
import { withRollback } from "@/test/db";
import { createPage, getPage, PageError } from "@/server/pages/service";
import { createText } from "@/server/texts/service";
import { FrontEditError, type FrontEditErrorCode, saveFrontEdit } from "./service";
import type { FrontEditInput } from "./schema";

const doc = (text: string) => ({
  type: "doc" as const,
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

async function expectFrontEditError(promise: Promise<unknown>, code: FrontEditErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof FrontEditError && error.code === code,
  );
}

const textBlock = (id: string, text: string) => ({
  id,
  type: "text",
  variant: null,
  data: { content: doc(text) },
});

const publishedPage = (tx: Tx, slug: string, published = true) =>
  createPage(tx, {
    parentId: null,
    slug,
    title: "Старый заголовок",
    blocks: [textBlock("b1", "Старый текст"), textBlock("b2", "Второй блок")],
    published,
  });

describe("front-edit service", () => {
  it("меняет только заголовок страницы", () =>
    withRollback(async (tx) => {
      const page = await publishedPage(tx, "front-edit-title");
      await saveFrontEdit(tx, { field: "page.title", pageId: page.id, value: "  Новый  " });
      expect(await getPage(tx, page.id)).toMatchObject({
        title: "Новый",
        slug: page.slug,
        path: page.path,
        blocks: page.blocks,
        published: true,
      });
    }));

  it("меняет один блок страницы и пересчитывает текст для поиска", () =>
    withRollback(async (tx) => {
      const page = await publishedPage(tx, "front-edit-block");
      await saveFrontEdit(tx, {
        field: "page.block",
        pageId: page.id,
        blockId: "b2",
        data: { content: doc(" Новый "), extra: "мусор" },
      });
      expect(await getPage(tx, page.id)).toMatchObject({
        blocks: [textBlock("b1", "Старый текст"), textBlock("b2", " Новый ")],
        searchText: "Старый текст\nНовый",
        title: page.title,
      });
    }));

  it("проверяет данные блока схемой его типа", () =>
    withRollback(async (tx) => {
      const page = await publishedPage(tx, "front-edit-block-invalid");
      await expect(
        saveFrontEdit(tx, { field: "page.block", pageId: page.id, blockId: "b1", data: {} }),
      ).rejects.toBeInstanceOf(z.ZodError);
      await expect(
        saveFrontEdit(tx, {
          field: "page.block",
          pageId: page.id,
          blockId: "missing",
          data: { content: doc("x") },
        }),
      ).rejects.toSatisfy(
        (error) => error instanceof PageError && error.code === "block_not_found",
      );
      expect((await getPage(tx, page.id))?.blocks).toEqual(page.blocks);
    }));

  it("не правит черновики и несуществующие страницы", () =>
    withRollback(async (tx) => {
      const draft = await publishedPage(tx, "front-edit-draft", false);
      await expectFrontEditError(
        saveFrontEdit(tx, { field: "page.title", pageId: draft.id, value: "Новый" }),
        "page_not_found",
      );
      await expectFrontEditError(
        saveFrontEdit(tx, {
          field: "page.block",
          pageId: draft.id,
          blockId: "b1",
          data: { content: doc("x") },
        }),
        "page_not_found",
      );
      await expectFrontEditError(
        saveFrontEdit(tx, { field: "page.title", pageId: 2_000_000_000, value: "Новый" }),
        "page_not_found",
      );
    }));

  it("меняет показываемый текст, но не скрытый", () =>
    withRollback(async (tx) => {
      await createText(tx, { key: "front-edit-shown", title: "Показан", body: "Было" });
      await createText(tx, {
        key: "front-edit-hidden",
        title: "Скрыт",
        body: "Было",
        published: false,
      });

      await saveFrontEdit(tx, { field: "text.body", key: "front-edit-shown", value: " Стало\n" });
      const [shown] = await tx.select().from(texts).where(eq(texts.key, "front-edit-shown"));
      expect(shown).toMatchObject({ body: "Стало", title: "Показан", published: true });

      await expectFrontEditError(
        saveFrontEdit(tx, { field: "text.body", key: "front-edit-hidden", value: "Стало" }),
        "text_not_found",
      );
      await expectFrontEditError(
        saveFrontEdit(tx, { field: "text.body", key: "front-edit-missing", value: "Стало" }),
        "text_not_found",
      );
    }));

  it("отклоняет поля не из белого списка и неверные значения", () =>
    withRollback(async (tx) => {
      const page = await publishedPage(tx, "front-edit-invalid");
      const invalid = [
        { field: "page.slug", pageId: page.id, value: "other" },
        { field: "page.published", pageId: page.id, value: false },
        { field: "page.title", pageId: page.id, value: "   " },
        { field: "page.content", pageId: page.id, value: null },
        { field: "page.block", pageId: page.id, blockId: "", data: {} },
        { field: "text.body", key: "../etc", value: "x" },
      ] as unknown as FrontEditInput[];
      for (const input of invalid) {
        await expect(saveFrontEdit(tx, input)).rejects.toBeInstanceOf(z.ZodError);
      }
      const [row] = await tx.select().from(pages).where(eq(pages.id, page.id));
      expect(row).toMatchObject({ slug: page.slug, title: page.title, published: true });
    }));
});
