import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { RichText } from "@/components/site/rich-text";
import { db } from "@/db";
import { loadContentContext } from "@/server/site/content";
import { articleDate } from "../../_components/article-card";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { getArticleForSlug, getSiteInfo } from "../../_lib/data";

type Props = PageProps<"/articles/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const [site, article] = await Promise.all([
    getSiteInfo(),
    getArticleForSlug((await params).slug),
  ]);
  if (!article) return { title: site.name };
  return {
    title: `${article.title} — ${site.name}`,
    description: article.excerpt ?? undefined,
    openGraph: article.previewUrl ? { images: [article.previewUrl] } : undefined,
  };
}

export default function ArticlePage({ params }: Props) {
  return (
    <Suspense>
      <ArticleView params={params} />
    </Suspense>
  );
}

async function ArticleView({ params }: Pick<Props, "params">) {
  await connection();
  const article = await getArticleForSlug((await params).slug);
  if (!article) notFound();
  const context = await loadContentContext(db(), article.content);

  return (
    <article className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ href: "/articles", title: "Статьи" }]} current={article.title} />
      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {article.title}
      </h1>
      {article.publishedAt && (
        <time
          dateTime={article.publishedAt.toISOString()}
          className="text-muted-foreground mb-6 block text-sm"
        >
          {articleDate.format(article.publishedAt)}
        </time>
      )}
      {article.previewUrl && (
        <div className="bg-muted relative mb-8 aspect-[16/9] overflow-hidden rounded-lg">
          <Image
            src={article.previewUrl}
            alt={article.previewAlt ?? ""}
            fill
            priority
            sizes="(min-width: 768px) 48rem, 100vw"
            className="object-cover"
          />
        </div>
      )}
      {article.excerpt && <p className="mb-6 text-lg">{article.excerpt}</p>}
      <RichText doc={article.content} context={context} />
    </article>
  );
}
