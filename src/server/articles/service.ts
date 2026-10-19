import "server-only";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Executor } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { articles, media } from "@/db/schema";
import { mediaUrl } from "@/lib/media";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { DomainError } from "@/server/errors";
import { assertImageExists } from "@/server/media/service";
import { type ArticleInput, articleInputSchema } from "./schema";

export type Article = typeof articles.$inferSelect;

export type ArticleErrorCode = "article_not_found" | "slug_taken";

export class ArticleError extends DomainError<ArticleErrorCode> {}

const notFound = () => new ArticleError("article_not_found", "Статья не найдена");

function toArticleError(error: unknown): unknown {
  return isUniqueViolation(error, "articles_slug_unique")
    ? new ArticleError("slug_taken", "Статья с таким адресом уже существует", "slug")
    : error;
}

// Дата публикации ставится при первой публикации и дальше не меняется,
// даже если статью снять с публикации и опубликовать снова.
export async function createArticle(executor: Executor, input: ArticleInput): Promise<Article> {
  const data = articleInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    if (data.previewId !== null) await assertImageExists(tx, data.previewId, "previewId");
    try {
      const [article] = await tx
        .insert(articles)
        .values({ ...data, publishedAt: data.published ? new Date() : null })
        .returning();
      return article;
    } catch (error) {
      throw toArticleError(error);
    }
  });
}

export async function updateArticle(
  executor: Executor,
  id: number,
  input: ArticleInput,
): Promise<Article> {
  const data = articleInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    const [current] = await tx
      .select({ publishedAt: articles.publishedAt })
      .from(articles)
      .where(eq(articles.id, id))
      .for("update");
    if (!current) throw notFound();
    if (data.previewId !== null) await assertImageExists(tx, data.previewId, "previewId");

    const publishedAt = current.publishedAt ?? (data.published ? new Date() : null);
    try {
      const [article] = await tx
        .update(articles)
        .set({ ...data, publishedAt })
        .where(eq(articles.id, id))
        .returning();
      return article;
    } catch (error) {
      throw toArticleError(error);
    }
  });
}

export async function deleteArticle(executor: Executor, id: number): Promise<void> {
  const deleted = await executor
    .delete(articles)
    .where(eq(articles.id, id))
    .returning({ id: articles.id });
  if (deleted.length === 0) throw notFound();
}

const previewUrl = (storageKey: string | null) => (storageKey ? mediaUrl(storageKey) : null);

export async function getArticle(executor: Executor, id: number) {
  const [row] = await executor
    .select({ article: articles, previewKey: media.storageKey })
    .from(articles)
    .leftJoin(media, eq(media.id, articles.previewId))
    .where(eq(articles.id, id));
  return row ? { ...row.article, previewUrl: previewUrl(row.previewKey) } : null;
}

export async function listArticles(
  executor: Executor,
  { page, search }: { page: number; search: string },
) {
  const where = search
    ? or(ilike(articles.title, likePattern(search)), ilike(articles.slug, likePattern(search)))
    : undefined;

  const [rows, [{ total }]] = await Promise.all([
    executor
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        published: articles.published,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        previewKey: media.storageKey,
      })
      .from(articles)
      .leftJoin(media, eq(media.id, articles.previewId))
      .where(where)
      // Черновики без даты публикации — по дате создания, новые сверху.
      .orderBy(
        desc(sql`coalesce(${articles.publishedAt}, ${articles.createdAt})`),
        desc(articles.id),
      )
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(articles).where(where),
  ]);
  return {
    items: rows.map(({ previewKey, ...row }) => ({ ...row, previewUrl: previewUrl(previewKey) })),
    total,
  };
}
