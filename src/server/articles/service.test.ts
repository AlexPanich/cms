import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { articles, media } from "@/db/schema";
import { MediaError } from "@/server/media/errors";
import { withRollback as withRollbackBase } from "@/test/db";
import type { ArticleInput } from "./schema";
import {
  ArticleError,
  type ArticleErrorCode,
  createArticle,
  deleteArticle,
  getArticle,
  listArticles,
  updateArticle,
} from "./service";

const withRollback = (fn: (tx: Tx) => Promise<void>) => withRollbackBase(fn, { clear: [articles] });

const input = (slug: string, extra: Partial<ArticleInput> = {}): ArticleInput => ({
  slug,
  title: slug,
  ...extra,
});

async function expectArticleError(promise: Promise<unknown>, code: ArticleErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof ArticleError && error.code === code,
  );
}

// Строка media без файла на диске — сервису статей файл не нужен.
async function insertMedia(tx: Tx, kind: "image" | "document" = "image") {
  const storageKey = `${kind}s/2026/01/${randomUUID()}.webp`;
  const [row] = await tx
    .insert(media)
    .values({ kind, storageKey, originalName: "a.png", mimeType: "image/webp", size: 1 })
    .returning();
  return row;
}

describe("articles service", () => {
  it("ставит дату публикации при первой публикации и сохраняет её дальше", () =>
    withRollback(async (tx) => {
      const draft = await createArticle(tx, input("news"));
      expect(draft.publishedAt).toBeNull();

      const published = await updateArticle(tx, draft.id, input("news", { published: true }));
      expect(published.publishedAt).toBeInstanceOf(Date);

      const hidden = await updateArticle(tx, draft.id, input("news", { published: false }));
      const again = await updateArticle(tx, draft.id, input("news", { published: true }));
      expect(hidden.publishedAt).toEqual(published.publishedAt);
      expect(again.publishedAt).toEqual(published.publishedAt);
    }));

  it("не даёт занять чужой адрес", () =>
    withRollback(async (tx) => {
      await createArticle(tx, input("first"));
      const second = await createArticle(tx, input("second"));
      await expectArticleError(createArticle(tx, input("first")), "slug_taken");
      await expectArticleError(updateArticle(tx, second.id, input("first")), "slug_taken");
    }));

  it("принимает в превью только существующую картинку", () =>
    withRollback(async (tx) => {
      const image = await insertMedia(tx);
      const document = await insertMedia(tx, "document");

      const article = await createArticle(tx, input("with-preview", { previewId: image.id }));
      expect((await getArticle(tx, article.id))?.previewUrl).toBe(`/media/${image.storageKey}`);

      for (const previewId of [document.id, 2_000_000_000]) {
        await expect(
          updateArticle(tx, article.id, input("with-preview", { previewId })),
        ).rejects.toSatisfy(
          (error) =>
            error instanceof MediaError &&
            error.code === "media_not_found" &&
            error.field === "previewId",
        );
      }
    }));

  it("ищет по заголовку и адресу, сортирует по дате", () =>
    withRollback(async (tx) => {
      await createArticle(tx, input("old", { title: "Старая новость", published: true }));
      await createArticle(tx, input("fresh", { title: "Свежая новость", published: true }));

      const { items, total } = await listArticles(tx, { page: 1, search: "новость" });
      expect(total).toBe(2);
      expect(items.map((item) => item.slug)).toEqual(["fresh", "old"]);
      expect((await listArticles(tx, { page: 1, search: "fre" })).items).toHaveLength(1);
    }));

  it("удаляет и сообщает об отсутствующей статье", () =>
    withRollback(async (tx) => {
      const article = await createArticle(tx, input("gone"));
      await deleteArticle(tx, article.id);
      expect(await getArticle(tx, article.id)).toBeNull();
      await expectArticleError(deleteArticle(tx, article.id), "article_not_found");
      await expectArticleError(updateArticle(tx, article.id, input("gone")), "article_not_found");
    }));
});
