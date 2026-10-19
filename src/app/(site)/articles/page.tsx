import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { db } from "@/db";
import { pageCount, parsePage } from "@/lib/pagination";
import { listPublishedArticles } from "@/server/site/service";
import { ArticleCard } from "../_components/article-card";
import { SitePagination } from "../_components/site-pagination";
import { getSiteInfo } from "../_lib/data";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const site = await getSiteInfo();
  return { title: `Статьи — ${site.name}` };
}

export default function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Статьи</h1>
      <Suspense>
        <ArticleList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ArticleList({ searchParams }: Pick<PageProps<"/articles">, "searchParams">) {
  await connection();
  const page = parsePage((await searchParams).page);
  const { items, total } = await listPublishedArticles(db(), { page });

  if (items.length === 0) {
    return <p className="text-muted-foreground">Статей пока нет</p>;
  }
  return (
    <>
      <ul className="flex flex-col gap-10">
        {items.map((article) => (
          <li key={article.slug}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
      <SitePagination page={page} pageCount={pageCount(total)} basePath="/articles" />
    </>
  );
}
