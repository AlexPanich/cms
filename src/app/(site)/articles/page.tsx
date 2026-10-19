import type { Metadata } from "next";
import { connection } from "next/server";
import { parsePage } from "@/lib/pagination";
import { ArticleCard } from "../_components/article-card";
import { NotFoundView } from "../_components/not-found-view";
import { SitePagination } from "../_components/site-pagination";
import { getArticlesPage } from "../_lib/data";
import { siteMetadata } from "../_lib/metadata";

type Props = PageProps<"/articles">;

export const instant = false;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  await connection();
  const page = parsePage((await searchParams).page);
  if (!(await getArticlesPage(page))) {
    return siteMetadata({ title: "Страница не найдена", noindex: true });
  }
  // У каждой страницы списка свой canonical: на них разные статьи.
  return siteMetadata(
    page > 1
      ? { title: `Статьи — страница ${page}`, path: `/articles?page=${page}` }
      : { title: "Статьи", path: "/articles" },
  );
}

// Номер страницы за пределами списка: proxy отвечает 404, здесь — для навигации на клиенте.
export default async function ArticlesPage({ searchParams }: Props) {
  await connection();
  const page = parsePage((await searchParams).page);
  const list = await getArticlesPage(page);
  if (!list) return <NotFoundView />;

  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Статьи</h1>
      {list.items.length === 0 ? (
        <p className="text-muted-foreground">Статей пока нет</p>
      ) : (
        <>
          <ul className="flex flex-col gap-10">
            {list.items.map((article) => (
              <li key={article.slug}>
                <ArticleCard article={article} />
              </li>
            ))}
          </ul>
          <SitePagination page={page} pageCount={list.pageCount} basePath="/articles" />
        </>
      )}
    </>
  );
}
