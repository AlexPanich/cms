import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { pages, texts } from "@/db/schema";
import type { Tx } from "@/db";
import { z } from "@/lib/zod";
import { withRollback } from "@/test/db";
import { createPage, getPage } from "@/server/pages/service";
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

const publishedPage = (tx: Tx, slug: string, published = true) =>
  createPage(tx, {
    parentId: null,
    slug,
    title: "Старый заголовок",
    content: doc("Старый текст"),
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
        content: doc("Старый текст"),
        published: true,
      });
    }));

  it("меняет текст страницы и может его очистить", () =>
    withRollback(async (tx) => {
      const page = await publishedPage(tx, "front-edit-content");
      await saveFrontEdit(tx, { field: "page.content", pageId: page.id, value: doc("Новый") });
      expect((await getPage(tx, page.id))?.content).toEqual(doc("Новый"));
      await saveFrontEdit(tx, { field: "page.content", pageId: page.id, value: null });
      expect(await getPage(tx, page.id)).toMatchObject({ content: null, title: page.title });
    }));

  it("не правит черновики и несуществующие страницы", () =>
    withRollback(async (tx) => {
      const draft = await publishedPage(tx, "front-edit-draft", false);
      await expectFrontEditError(
        saveFrontEdit(tx, { field: "page.title", pageId: draft.id, value: "Новый" }),
        "page_not_found",
      );
      await expectFrontEditError(
        saveFrontEdit(tx, { field: "page.content", pageId: 2_000_000_000, value: null }),
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
        { field: "page.content", pageId: page.id, value: "<script>" },
        { field: "text.body", key: "../etc", value: "x" },
      ] as unknown as FrontEditInput[];
      for (const input of invalid) {
        await expect(saveFrontEdit(tx, input)).rejects.toBeInstanceOf(z.ZodError);
      }
      const [row] = await tx.select().from(pages).where(eq(pages.id, page.id));
      expect(row).toMatchObject({ slug: page.slug, title: page.title, published: true });
    }));
});
