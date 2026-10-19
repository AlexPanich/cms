import type { Metadata } from "next";
import { connection } from "next/server";
import { db } from "@/db";
import { pageCount, parsePage } from "@/lib/pagination";
import { listPublishedArticles } from "@/server/site/service";
import { ArticleCard } from "../_components/article-card";
import { SitePagination } from "../_components/site-pagination";
import { siteMetadata } from "../_lib/metadata";

type Props = PageProps<"/articles">;

export const instant = false;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await connection();
  const page = parsePage((await searchParams).page);
  // У каждой страницы списка свой canonical: на них разные статьи.
  return siteMetadata(
    page > 1
      ? { title: `Статьи — страница ${page}`, path: `/articles?page=${page}` }
      : { title: "Статьи", path: "/articles" },
  );
}

export default async function ArticlesPage({ searchParams }: Props) {
  await connection();
  const page = parsePage((await searchParams).page);
  const { items, total } = await listPublishedArticles(db(), { page });

  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Статьи</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Статей пока нет</p>
      ) : (
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
      )}
    </>
  );
}
