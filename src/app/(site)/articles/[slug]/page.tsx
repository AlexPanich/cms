import type { Metadata } from "next";
import Image from "next/image";
import { connection } from "next/server";
import { JsonLd } from "@/components/site/json-ld";
import { RichText } from "@/components/site/rich-text";
import { richTextExcerpt } from "@/lib/rich-text";
import { loadContentContext } from "@/server/site/content";
import { absoluteUrl } from "@/server/site/url";
import { articleDate } from "../../_components/article-card";
import { Breadcrumbs, BreadcrumbsJsonLd } from "../../_components/breadcrumbs";
import { NotFoundView } from "../../_components/not-found-view";
import { getArticleForSlug, getSiteInfo } from "../../_lib/data";
import { siteMetadata } from "../../_lib/metadata";

type Props = PageProps<"/articles/[slug]">;

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const article = await getArticleForSlug((await params).slug);
  if (!article) return siteMetadata({ title: "Статья не найдена", noindex: true });
  return siteMetadata({
    title: article.title,
    description: article.excerpt ?? richTextExcerpt(article.content),
    path: `/articles/${article.slug}`,
    image: article.previewUrl,
    article: { publishedTime: article.publishedAt, modifiedTime: article.updatedAt },
  });
}

// Несуществующую статью отсекает proxy (404); здесь — для навигации на клиенте.
export default async function ArticlePage({ params }: Props) {
  await connection();
  const article = await getArticleForSlug((await params).slug);
  if (!article) return <NotFoundView />;
  const [context, site] = await Promise.all([loadContentContext(article.content), getSiteInfo()]);
  const crumbs = [{ href: "/articles", title: "Статьи" }];

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd
        data={{
          "@type": "Article",
          headline: article.title,
          description: article.excerpt ?? undefined,
          image: article.previewUrl ? [absoluteUrl(article.previewUrl)] : undefined,
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          mainEntityOfPage: absoluteUrl(`/articles/${article.slug}`),
          publisher: { "@type": "Organization", name: site.name, url: absoluteUrl("/") },
        }}
      />
      <BreadcrumbsJsonLd
        items={crumbs}
        current={{ href: `/articles/${article.slug}`, title: article.title }}
      />
      <Breadcrumbs items={crumbs} current={article.title} />
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
