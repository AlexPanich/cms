import type { Metadata } from "next";
import { connection } from "next/server";
import { BreadcrumbsJsonLd } from "@/components/site/breadcrumbs-json-ld";
import { JsonLd } from "@/components/site/json-ld";
import { richTextExcerpt } from "@/lib/rich-text";
import { loadContentContext } from "@/server/site/content";
import { absoluteUrl } from "@/server/site/url";
import { theme } from "@/theme";
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
  if (!article) return <theme.NotFound />;
  const [context, site] = await Promise.all([loadContentContext(article.content), getSiteInfo()]);
  const crumbs = [{ href: "/articles", title: "Статьи" }];

  return (
    <>
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
      <theme.Article article={article} crumbs={crumbs} context={context} />
    </>
  );
}
