import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { getArticle } from "@/server/articles/service";
import { requirePagePermission } from "@/server/auth/session";
import { ArticleForm } from "../_components/article-form";
import { deleteArticle } from "../actions";

export const metadata: Metadata = { title: "Статья" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" });

export default async function ArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_articles", `/admin/articles/${id}`);

  const numericId = Number(id);
  const article =
    Number.isSafeInteger(numericId) && numericId > 0 ? await getArticle(db(), numericId) : null;
  if (!article) notFound();

  return (
    <>
      <PageHeader
        title={article.title}
        description={
          article.publishedAt
            ? `Опубликована ${dateFormat.format(article.publishedAt)}`
            : "Ещё не публиковалась"
        }
      >
        <ConfirmAction
          action={deleteArticle.bind(null, article.id)}
          title="Удалить статью?"
          description="Статья пропадёт с сайта. Действие нельзя отменить."
          successMessage="Статья удалена"
          redirectTo="/admin/articles"
          variant="outline"
        >
          <Trash2Icon />
          Удалить
        </ConfirmAction>
      </PageHeader>

      {/* key: после сохранения превью и поля формы берутся из свежих данных. */}
      <ArticleForm
        key={article.updatedAt.toISOString()}
        article={{
          id: article.id,
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt ?? "",
          content: article.content,
          previewId: article.previewId,
          previewUrl: article.previewUrl,
          published: article.published,
        }}
      />
    </>
  );
}
