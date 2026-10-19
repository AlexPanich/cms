import Image from "next/image";
import { RichText } from "@/components/site/rich-text";
import type { ArticleListProps, ArticleProps } from "@/components/site/theme";
import { ArticleCard, articleDate } from "./article-card";
import { Breadcrumbs } from "./breadcrumbs";
import { PROSE, WIDGETS } from "./rich-text";
import { SitePagination } from "./site-pagination";

export function ArticleList({ articles, page, pageCount }: ArticleListProps) {
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Статьи</h1>
      {articles.length === 0 ? (
        <p className="text-muted-foreground">Статей пока нет</p>
      ) : (
        <>
          <ul className="flex flex-col gap-10">
            {articles.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
          <SitePagination page={page} pageCount={pageCount} basePath="/articles" />
        </>
      )}
    </>
  );
}

export function Article({ article, crumbs, context }: ArticleProps) {
  return (
    <article className="mx-auto max-w-3xl">
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
      <RichText doc={article.content} context={context} widgets={WIDGETS} className={PROSE} />
    </article>
  );
}
